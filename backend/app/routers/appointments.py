from datetime import datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user, require_admin_or_barber
from app.models import Appointment, AppointmentStatus, Service, User, UserRole
from app.schemas import (
    AppointmentAdminCreate,
    AppointmentCreate,
    AppointmentOut,
    AppointmentUpdate,
    AvailabilitySlot,
)


router = APIRouter(prefix="/api/appointments", tags=["appointments"])


WORK_START = time(9, 0)
WORK_END = time(20, 0)
SLOT_GRANULARITY_MIN = 30


def _ensure_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _check_overlap(db: Session, barber_id: int, start_at: datetime, end_at: datetime, exclude_id: int | None = None) -> None:
    query = db.query(Appointment).filter(
        Appointment.barber_id == barber_id,
        Appointment.status != AppointmentStatus.cancelled,
        Appointment.start_at < end_at,
        Appointment.end_at > start_at,
    )
    if exclude_id is not None:
        query = query.filter(Appointment.id != exclude_id)
    if query.first() is not None:
        raise HTTPException(status_code=409, detail="El barbero ya tiene una cita en ese horario")


def _validate_business_hours(start_at: datetime, end_at: datetime) -> None:
    if end_at <= start_at:
        raise HTTPException(status_code=400, detail="La hora de fin debe ser posterior a la de inicio")
    if start_at.time() < WORK_START or end_at.time() > WORK_END:
        raise HTTPException(
            status_code=400,
            detail=f"Horario laboral: {WORK_START.strftime('%H:%M')} - {WORK_END.strftime('%H:%M')}",
        )


@router.get("", response_model=list[AppointmentOut])
def list_appointments(
    from_date: datetime | None = Query(default=None),
    to_date: datetime | None = Query(default=None),
    barber_id: int | None = None,
    client_id: int | None = None,
    status: AppointmentStatus | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Appointment]:
    query = db.query(Appointment).options(
        joinedload(Appointment.client),
        joinedload(Appointment.barber),
        joinedload(Appointment.service),
    )

    # Scope por rol
    if user.role == UserRole.client:
        query = query.filter(Appointment.client_id == user.id)
    elif user.role == UserRole.barber:
        # Barberos ven sus citas asignadas
        query = query.filter(Appointment.barber_id == user.id)
    # admin ve todas

    if barber_id is not None and user.role == UserRole.admin:
        query = query.filter(Appointment.barber_id == barber_id)
    if client_id is not None and user.role in (UserRole.admin, UserRole.barber):
        query = query.filter(Appointment.client_id == client_id)
    if status is not None:
        query = query.filter(Appointment.status == status)
    if from_date is not None:
        query = query.filter(Appointment.start_at >= _ensure_aware(from_date))
    if to_date is not None:
        query = query.filter(Appointment.start_at <= _ensure_aware(to_date))

    return query.order_by(Appointment.start_at.asc()).all()


@router.post("", response_model=AppointmentOut, status_code=201)
def create_appointment(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Appointment:
    barber = db.get(User, payload.barber_id)
    if not barber or barber.role != UserRole.barber or not barber.is_active:
        raise HTTPException(status_code=404, detail="Barbero no disponible")

    service = db.get(Service, payload.service_id)
    if not service or not service.is_active:
        raise HTTPException(status_code=404, detail="Servicio no disponible")

    start_at = _ensure_aware(payload.start_at)
    end_at = start_at + timedelta(minutes=service.duration_minutes)

    if start_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="No puedes reservar en el pasado")

    _validate_business_hours(start_at, end_at)
    _check_overlap(db, barber.id, start_at, end_at)

    appointment = Appointment(
        client_id=user.id,
        barber_id=barber.id,
        service_id=service.id,
        start_at=start_at,
        end_at=end_at,
        status=AppointmentStatus.confirmed,
        notes=payload.notes,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.post("/admin", response_model=AppointmentOut, status_code=201)
def create_appointment_admin(
    payload: AppointmentAdminCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin_or_barber),
) -> Appointment:
    """Admin/barbero crea cita en nombre de un cliente."""
    client = db.get(User, payload.client_id)
    if not client or client.role != UserRole.client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    barber = db.get(User, payload.barber_id)
    if not barber or barber.role != UserRole.barber or not barber.is_active:
        raise HTTPException(status_code=404, detail="Barbero no disponible")

    service = db.get(Service, payload.service_id)
    if not service or not service.is_active:
        raise HTTPException(status_code=404, detail="Servicio no disponible")

    start_at = _ensure_aware(payload.start_at)
    end_at = start_at + timedelta(minutes=service.duration_minutes)
    _validate_business_hours(start_at, end_at)
    _check_overlap(db, barber.id, start_at, end_at)

    appointment = Appointment(
        client_id=client.id,
        barber_id=barber.id,
        service_id=service.id,
        start_at=start_at,
        end_at=end_at,
        status=AppointmentStatus.confirmed,
        notes=payload.notes,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.patch("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: int,
    payload: AppointmentUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Appointment:
    appt = db.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    if user.role == UserRole.client and appt.client_id != user.id:
        raise HTTPException(status_code=403, detail="No autorizado")
    if user.role == UserRole.barber and appt.barber_id != user.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    data = payload.model_dump(exclude_unset=True)

    new_barber_id = data.get("barber_id", appt.barber_id)
    new_service_id = data.get("service_id", appt.service_id)
    new_start_at = data.get("start_at")

    if user.role == UserRole.client and ("barber_id" in data or "service_id" in data):
        raise HTTPException(status_code=403, detail="Solo personal puede cambiar barbero/servicio")

    if new_start_at is not None or "service_id" in data or "barber_id" in data:
        service = db.get(Service, new_service_id)
        if not service:
            raise HTTPException(status_code=404, detail="Servicio no encontrado")
        start_at = _ensure_aware(new_start_at) if new_start_at else appt.start_at
        end_at = start_at + timedelta(minutes=service.duration_minutes)
        _validate_business_hours(start_at, end_at)
        _check_overlap(db, new_barber_id, start_at, end_at, exclude_id=appt.id)
        appt.start_at = start_at
        appt.end_at = end_at
        appt.barber_id = new_barber_id
        appt.service_id = new_service_id

    if "status" in data:
        appt.status = data["status"]
    if "notes" in data:
        appt.notes = data["notes"]

    db.commit()
    db.refresh(appt)
    return appt


@router.delete("/{appointment_id}", status_code=204)
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    appt = db.get(Appointment, appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    if user.role == UserRole.client and appt.client_id != user.id:
        raise HTTPException(status_code=403, detail="No autorizado")
    if user.role == UserRole.barber and appt.barber_id != user.id:
        raise HTTPException(status_code=403, detail="No autorizado")

    appt.status = AppointmentStatus.cancelled
    db.commit()
    return None


@router.get("/availability", response_model=list[AvailabilitySlot])
def get_availability(
    barber_id: int,
    date: datetime,
    service_id: int,
    db: Session = Depends(get_db),
) -> list[AvailabilitySlot]:
    barber = db.get(User, barber_id)
    if not barber or barber.role != UserRole.barber:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")

    service = db.get(Service, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    target_date = _ensure_aware(date).date()
    day_start = datetime.combine(target_date, WORK_START, tzinfo=timezone.utc)
    day_end = datetime.combine(target_date, WORK_END, tzinfo=timezone.utc)

    booked = (
        db.query(Appointment)
        .filter(
            Appointment.barber_id == barber_id,
            Appointment.status != AppointmentStatus.cancelled,
            Appointment.start_at >= day_start - timedelta(hours=2),
            Appointment.start_at <= day_end + timedelta(hours=2),
        )
        .all()
    )

    slots: list[AvailabilitySlot] = []
    cursor = day_start
    duration = timedelta(minutes=service.duration_minutes)
    granularity = timedelta(minutes=SLOT_GRANULARITY_MIN)
    now = datetime.now(timezone.utc)

    while cursor + duration <= day_end:
        if cursor >= now:
            overlap = any(b.start_at < cursor + duration and b.end_at > cursor for b in booked)
            if not overlap:
                slots.append(AvailabilitySlot(start_at=cursor, end_at=cursor + duration))
        cursor += granularity

    return slots
