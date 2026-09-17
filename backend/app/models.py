import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Enum
)
from sqlalchemy.orm import relationship

from .database import Base


class SpotType(str, enum.Enum):
    compact = "compact"
    standard = "standard"
    ev = "ev"


class SessionStatus(str, enum.Enum):
    active = "active"
    completed = "completed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Spot(Base):
    __tablename__ = "spots"

    id = Column(Integer, primary_key=True, index=True)
    spot_number = Column(String, unique=True, index=True, nullable=False)
    level = Column(Integer, nullable=False)
    type = Column(Enum(SpotType), nullable=False, index=True)
    is_occupied = Column(Boolean, default=False, index=True)

    sessions = relationship("ParkingSession", back_populates="spot")


class ParkingSession(Base):
    __tablename__ = "parking_sessions"

    id = Column(Integer, primary_key=True, index=True)
    plate = Column(String, index=True, nullable=False)
    vehicle_type = Column(Enum(SpotType), nullable=False)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=False)
    check_in_time = Column(DateTime, default=datetime.utcnow, index=True)
    check_out_time = Column(DateTime, nullable=True)
    fee = Column(Float, nullable=True)
    status = Column(Enum(SessionStatus), default=SessionStatus.active, index=True)

    spot = relationship("Spot", back_populates="sessions")
