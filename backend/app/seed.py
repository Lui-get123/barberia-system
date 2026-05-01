"""Seed initial data: admin user + sample services + sample barbers."""
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Service, User, UserRole
from app.security import hash_password


def seed_admin(db: Session) -> User:
    admin = db.query(User).filter(User.email == settings.seed_admin_email.lower()).first()
    if admin:
        return admin
    admin = User(
        email=settings.seed_admin_email.lower(),
        hashed_password=hash_password(settings.seed_admin_password),
        full_name=settings.seed_admin_name,
        role=UserRole.admin,
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def seed_services(db: Session) -> None:
    if db.query(Service).first():
        return
    samples = [
        Service(name="Corte clásico", description="Corte tradicional con tijera y máquina", duration_minutes=30, price=15.0),
        Service(name="Corte + Barba", description="Corte completo con arreglo de barba", duration_minutes=45, price=25.0),
        Service(name="Solo Barba", description="Perfilado y arreglo de barba", duration_minutes=20, price=10.0),
        Service(name="Afeitado clásico", description="Afeitado con navaja y toalla caliente", duration_minutes=30, price=18.0),
        Service(name="Coloración", description="Tinte para cabello o barba", duration_minutes=60, price=35.0),
        Service(name="Tratamiento capilar", description="Hidratación profunda y masaje", duration_minutes=45, price=28.0),
    ]
    db.add_all(samples)
    db.commit()


def seed_sample_barbers(db: Session) -> None:
    samples = [
        ("juan@barberia.com", "Juan Pérez", "Barbero clásico", "Especialista en cortes tradicionales con 10 años de experiencia."),
        ("carlos@barberia.com", "Carlos Ruiz", "Estilista moderno", "Experto en estilos modernos, fades y diseños creativos."),
    ]
    for email, name, specialty, bio in samples:
        if db.query(User).filter(User.email == email).first():
            continue
        user = User(
            email=email,
            hashed_password=hash_password("barbero123"),
            full_name=name,
            role=UserRole.barber,
            specialty=specialty,
            bio=bio,
            is_active=True,
        )
        db.add(user)
    db.commit()


def run_seed(db: Session) -> None:
    seed_admin(db)
    seed_services(db)
    seed_sample_barbers(db)
