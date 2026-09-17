# City Centre Parking Garage — Attendant System

A full-stack app for running a busy multi-level parking garage: check a car in,
check it out, charge the right tiered fee, keep every spot type (compact /
standard / EV-with-charger) from ever being double-parked, and let the
attendant answer "is an EV spot free right now?" or "where's plate XYZ?" in
one glance.

- **Backend:** FastAPI + SQLAlchemy + SQLite, JWT auth
- **Frontend:** Angular 17 (standalone components)

## Project layout

```
parking-garage/
  backend/
    app/
      main.py         # all API routes
      models.py        # SQLAlchemy models (User, Spot, ParkingSession)
      schemas.py        # Pydantic request/response models
      auth.py           # JWT + password hashing
      billing.py         # tiered fee calculation (see "Billing rules" below)
      database.py        # SQLite engine/session
    requirements.txt
  frontend/
    src/app/
      components/landing   # public landing page (product overview)
      components/login
      components/register
      components/dashboard # check-in, live availability, search/sort/paginate sessions
      services/             # auth.service, parking.service, auth.interceptor
      guards/                # route guard for /dashboard
```

## Database

SQLite, via SQLAlchemy — this is real, on-disk persistence with a proper
schema (not an in-memory dict). The file `backend/parking.db` is created
automatically the first time the backend starts (`Base.metadata.create_all`
in `main.py`), and a 3-level garage (8 compact + 8 standard + 2 EV spots per
level) is seeded automatically on first boot. No separate install/service is
needed — this is exactly why SQLite is a good fit for a Codespaces demo: zero
setup, still a real relational schema with foreign keys
(`parking_sessions.spot_id → spots.id`) you can inspect with any SQLite
browser or `sqlite3 backend/parking.db`.

Tables: `users`, `spots`, `parking_sessions`.

## Setup & run (GitHub Codespaces)

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Codespaces will prompt to forward port 8000 — make it **public** (or at
least visible to you) if you want to hit it directly. API docs (Swagger UI)
are auto-generated at `/docs`, e.g. `http://localhost:8000/docs`.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm start
```

This runs `ng serve --host 0.0.0.0 --port 4200`, and `proxy.conf.json`
forwards any `/api/*` call from Angular straight to `http://localhost:8000`,
so the frontend never needs to know the backend's Codespaces URL — just open
the forwarded port-4200 URL in the browser.

### 3. First use

1. Open the app → **Register** an attendant account → **Login**.
2. On the dashboard: check a plate in (pick compact / standard / EV), watch
   live availability drop, search/sort the sessions table, and check the car
   back out to see the computed fee.

## Debugging tips

- **Backend won't start / "address already in use":** another `uvicorn`
  is still running — `pkill -f uvicorn` and retry.
- **"No free X spot available" on check-in:** that spot type is genuinely
  full — check `/api/spots/availability` or check another car out first.
- **Frontend shows network errors:** confirm the backend is running on
  port 8000 (the proxy is hard-coded to `localhost:8000`) and that you're
  hitting the frontend's forwarded URL, not the backend's.
- **Reset all data:** stop the backend, delete `backend/parking.db`, restart
  — it reseeds the garage automatically.
- **401 Unauthorized on API calls:** the JWT expires after 8 hours, or
  `localStorage` was cleared — just log in again.

## Billing rules (tiered, capped, round-up)

Implemented in `backend/app/billing.py`:

- First hour: ₹50
- Each additional hour: ₹30 (cheaper than the first, as required)
- Daily cap: ₹300 per 24-hour block — a multi-day stay is billed as
  consecutive capped 24-hour blocks, so a long stay is never overcharged
- Any part of an hour rounds up to a full hour

## API endpoints

All routes except `/api/auth/register` and `/api/auth/login` require
`Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an attendant account |
| POST | `/api/auth/login` | Log in (OAuth2 form body), returns a JWT |
| GET | `/api/auth/me` | Current logged-in user |
| GET | `/api/spots` | List spots — filter by `type`, `level`, `available_only`; paginate (`page`, `page_size`); sort (`sort_by`, `order`) |
| GET | `/api/spots/availability` | Free/total count per spot type — answers "is an EV spot free right now?" |
| POST | `/api/checkin` | `{ plate, vehicle_type }` → assigns a free spot of the matching type (EV always gets an EV spot), creates a session |
| POST | `/api/checkout/{session_id}` | Closes the session, computes the tiered fee, frees the spot |
| GET | `/api/sessions` | Search/list sessions — `plate` (partial match), `status`; paginate; sort by `check_in_time`, `check_out_time`, `fee`, or `plate` |
| GET | `/api/sessions/{id}` | Single session detail |
| GET | `/api/health` | Health check |

Full interactive docs: `http://localhost:8000/docs`.
