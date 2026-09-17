from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import asc, desc
from sqlalchemy.orm import Session

from . import models, schemas, auth
from .database import engine, get_db, Base

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="City Centre Parking Garage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def seed_spots():
    """Seed a small multi-level garage the first time the app boots."""
    db = next(get_db())
    if db.query(models.Spot).count() > 0:
        return
    layout = []
    for level in range(1, 4):  # 3 levels
        for i in range(1, 9):  # 8 compact
            layout.append((f"L{level}-C{i}", level, models.SpotType.compact))
        for i in range(1, 9):  # 8 standard
            layout.append((f"L{level}-S{i}", level, models.SpotType.standard))
        for i in range(1, 3):  # 2 EV
            layout.append((f"L{level}-EV{i}", level, models.SpotType.ev))
    for spot_number, level, spot_type in layout:
        db.add(models.Spot(spot_number=spot_number, level=level, type=spot_type))
    db.commit()


# ------------------------------------------------------------------
# Auth
# ------------------------------------------------------------------
@app.post("/api/auth/register", response_model=schemas.UserOut, tags=["auth"])
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    db_user = models.User(username=user.username, hashed_password=auth.hash_password(user.password))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/api/auth/login", response_model=schemas.Token, tags=["auth"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    token = auth.create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=schemas.UserOut, tags=["auth"])
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# ------------------------------------------------------------------
# Spots
# ------------------------------------------------------------------
@app.get("/api/spots", response_model=schemas.PaginatedSpots, tags=["spots"])
def list_spots(
    type: Optional[models.SpotType] = None,
    available_only: bool = False,
    level: Optional[int] = None,
    sort_by: str = Query("spot_number", enum=["spot_number", "level", "type"]),
    order: str = Query("asc", enum=["asc", "desc"]),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.Spot)
    if type:
        q = q.filter(models.Spot.type == type)
    if level is not None:
        q = q.filter(models.Spot.level == level)
    if available_only:
        q = q.filter(models.Spot.is_occupied == False)  # noqa: E712

    total = q.count()
    col = getattr(models.Spot, sort_by)
    q = q.order_by(asc(col) if order == "asc" else desc(col))
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@app.get("/api/spots/availability", response_model=list[schemas.SpotAvailability], tags=["spots"])
def spot_availability(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Answers 'is an EV / compact / standard spot free right now?' at a glance."""
    results = []
    for spot_type in models.SpotType:
        total = db.query(models.Spot).filter(models.Spot.type == spot_type).count()
        available = (
            db.query(models.Spot)
            .filter(models.Spot.type == spot_type, models.Spot.is_occupied == False)  # noqa: E712
            .count()
        )
        results.append({"type": spot_type, "total": total, "available": available})
    return results


# ------------------------------------------------------------------
# Check-in / Check-out
# ------------------------------------------------------------------
@app.post("/api/checkin", response_model=schemas.SessionOut, tags=["sessions"])
def check_in(payload: schemas.CheckInRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # A car already parked (active session, same plate) can't check in twice.
    existing = (
        db.query(models.ParkingSession)
        .filter(models.ParkingSession.plate == payload.plate, models.ParkingSession.status == models.SessionStatus.active)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail=f"Plate {payload.plate} is already checked in (session {existing.id})")

    # An EV must get an EV spot; other types are matched to the same spot type.
    spot = (
        db.query(models.Spot)
        .filter(models.Spot.type == payload.vehicle_type, models.Spot.is_occupied == False)  # noqa: E712
        .first()
    )
    if not spot:
        raise HTTPException(status_code=409, detail=f"No free {payload.vehicle_type.value} spot available")

    spot.is_occupied = True
    session = models.ParkingSession(
        plate=payload.plate,
        vehicle_type=payload.vehicle_type,
        spot_id=spot.id,
        check_in_time=datetime.utcnow(),
        status=models.SessionStatus.active,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@app.post("/api/checkout/{session_id}", response_model=schemas.CheckOutResponse, tags=["sessions"])
def check_out(session_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    from .billing import calculate_fee

    session = db.query(models.ParkingSession).filter(models.ParkingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status == models.SessionStatus.completed:
        raise HTTPException(status_code=400, detail="Session already checked out")

    session.check_out_time = datetime.utcnow()
    fee, hours = calculate_fee(session.check_in_time, session.check_out_time)
    session.fee = fee
    session.status = models.SessionStatus.completed

    spot = db.query(models.Spot).filter(models.Spot.id == session.spot_id).first()
    spot.is_occupied = False

    db.commit()
    db.refresh(session)
    return {"session": session, "fee": fee, "hours_charged": hours}


@app.get("/api/sessions", response_model=schemas.PaginatedSessions, tags=["sessions"])
def list_sessions(
    plate: Optional[str] = Query(None, description="Search by plate (partial match)"),
    status_filter: Optional[models.SessionStatus] = Query(None, alias="status"),
    sort_by: str = Query("check_in_time", enum=["check_in_time", "check_out_time", "fee", "plate"]),
    order: str = Query("desc", enum=["asc", "desc"]),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.ParkingSession)
    if plate:
        q = q.filter(models.ParkingSession.plate.ilike(f"%{plate}%"))
    if status_filter:
        q = q.filter(models.ParkingSession.status == status_filter)

    total = q.count()
    col = getattr(models.ParkingSession, sort_by)
    q = q.order_by(asc(col) if order == "asc" else desc(col))
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@app.get("/api/sessions/{session_id}", response_model=schemas.SessionOut, tags=["sessions"])
def get_session(session_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    session = db.query(models.ParkingSession).filter(models.ParkingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
