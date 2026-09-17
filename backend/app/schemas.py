from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

from .models import SpotType, SessionStatus


# ---- Auth ----
class UserCreate(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---- Spots ----
class SpotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    spot_number: str
    level: int
    type: SpotType
    is_occupied: bool


class SpotAvailability(BaseModel):
    type: SpotType
    total: int
    available: int


class PaginatedSpots(BaseModel):
    items: List[SpotOut]
    total: int
    page: int
    page_size: int


# ---- Sessions ----
class CheckInRequest(BaseModel):
    plate: str
    vehicle_type: SpotType


class SessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    plate: str
    vehicle_type: SpotType
    spot_id: int
    check_in_time: datetime
    check_out_time: Optional[datetime]
    fee: Optional[float]
    status: SessionStatus


class CheckOutResponse(BaseModel):
    session: SessionOut
    fee: float
    hours_charged: int


class PaginatedSessions(BaseModel):
    items: List[SessionOut]
    total: int
    page: int
    page_size: int
