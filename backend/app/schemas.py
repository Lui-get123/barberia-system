from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import AppointmentStatus, UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    specialty: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=6)
    role: UserRole = UserRole.client


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    specialty: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=6)


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: UserRole
    is_active: bool
    created_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int = 30
    price: float = 0.0
    is_active: bool = True


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[float] = None
    is_active: Optional[bool] = None


class ServiceOut(ServiceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class AppointmentCreate(BaseModel):
    barber_id: int
    service_id: int
    start_at: datetime
    notes: Optional[str] = None


class AppointmentAdminCreate(AppointmentCreate):
    client_id: int


class AppointmentUpdate(BaseModel):
    start_at: Optional[datetime] = None
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None
    barber_id: Optional[int] = None
    service_id: Optional[int] = None


class AppointmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int
    barber_id: int
    service_id: int
    start_at: datetime
    end_at: datetime
    status: AppointmentStatus
    notes: Optional[str] = None
    created_at: datetime
    client: UserOut
    barber: UserOut
    service: ServiceOut


class AvailabilitySlot(BaseModel):
    start_at: datetime
    end_at: datetime


class DashboardStats(BaseModel):
    total_clients: int
    total_barbers: int
    total_services: int
    total_appointments: int
    appointments_today: int
    appointments_this_week: int
    revenue_this_month: float
    upcoming_appointments: int
