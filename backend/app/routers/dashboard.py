from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models import Appointment, AppointmentStatus, Service, User, UserRole
from app.schemas import DashboardStats


router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> DashboardStats:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)

    total_clients = db.query(func.count(User.id)).filter(User.role == UserRole.client).scalar() or 0
    total_barbers = db.query(func.count(User.id)).filter(User.role == UserRole.barber).scalar() or 0
    total_services = db.query(func.count(Service.id)).filter(Service.is_active.is_(True)).scalar() or 0
    total_appointments = db.query(func.count(Appointment.id)).scalar() or 0

    appointments_today = (
        db.query(func.count(Appointment.id))
        .filter(
            Appointment.start_at >= today_start,
            Appointment.start_at < today_start + timedelta(days=1),
            Appointment.status != AppointmentStatus.cancelled,
        )
        .scalar()
        or 0
    )

    appointments_this_week = (
        db.query(func.count(Appointment.id))
        .filter(
            Appointment.start_at >= week_start,
            Appointment.start_at < week_start + timedelta(days=7),
            Appointment.status != AppointmentStatus.cancelled,
        )
        .scalar()
        or 0
    )

    revenue_query = (
        db.query(func.coalesce(func.sum(Service.price), 0.0))
        .join(Appointment, Appointment.service_id == Service.id)
        .filter(
            Appointment.start_at >= month_start,
            Appointment.status == AppointmentStatus.completed,
        )
        .scalar()
    )
    revenue_this_month = float(revenue_query or 0.0)

    upcoming_appointments = (
        db.query(func.count(Appointment.id))
        .filter(
            Appointment.start_at >= now,
            Appointment.status.in_([AppointmentStatus.pending, AppointmentStatus.confirmed]),
        )
        .scalar()
        or 0
    )

    return DashboardStats(
        total_clients=int(total_clients),
        total_barbers=int(total_barbers),
        total_services=int(total_services),
        total_appointments=int(total_appointments),
        appointments_today=int(appointments_today),
        appointments_this_week=int(appointments_this_week),
        revenue_this_month=revenue_this_month,
        upcoming_appointments=int(upcoming_appointments),
    )
