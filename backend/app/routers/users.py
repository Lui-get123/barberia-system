from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models import User, UserRole
from app.schemas import UserCreate, UserOut, UserUpdate
from app.security import hash_password


router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(
    role: UserRole | None = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> list[User]:
    query = db.query(User)
    if role is not None:
        query = query.filter(User.role == role)
    return query.order_by(User.created_at.desc()).all()


@router.get("/barbers", response_model=list[UserOut])
def list_barbers(db: Session = Depends(get_db)) -> list[User]:
    """Pública para que clientes puedan elegir barbero al reservar."""
    return (
        db.query(User)
        .filter(User.role == UserRole.barber, User.is_active.is_(True))
        .order_by(User.full_name.asc())
        .all()
    )


@router.post("", response_model=UserOut, status_code=201)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> User:
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Este email ya está registrado")
    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        role=payload.role,
        avatar_url=payload.avatar_url,
        bio=payload.bio,
        specialty=payload.specialty,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    # Solo admin o el mismo usuario
    if current.role != UserRole.admin and current.id != user.id:
        raise HTTPException(status_code=403, detail="No autorizado")
    # Solo admin puede activar/desactivar
    if payload.is_active is not None and current.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Solo admin puede cambiar estado")

    data = payload.model_dump(exclude_unset=True)
    if "password" in data and data["password"]:
        user.hashed_password = hash_password(data.pop("password"))
    else:
        data.pop("password", None)
    for key, value in data.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> None:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta de admin")
    # Soft delete: desactivar
    user.is_active = False
    db.commit()
    return None
