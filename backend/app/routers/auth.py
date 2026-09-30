from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.services.auth_service import (
    verify_password, create_access_token, get_current_user, get_required_current_user
)
from app.services.audit_service import AuditService

router = APIRouter(prefix="/api/auth", tags=["Authentication & Access Control"])

class LoginInput(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    full_name: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginInput, db: Session = Depends(get_db)):
    """Authenticate user with username/email and password."""
    username_or_email = payload.username.strip()
    user = db.query(User).filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        AuditService.log(
            db=db,
            event_id="AUTH_LOGIN",
            actor_role="Unauthenticated User",
            action="LOGIN_FAILED",
            status="FAILED",
            reason=f"Failed login attempt for username/email '{username_or_email}'"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated."
        )

    # Log successful authentication
    AuditService.log(
        db=db,
        event_id="AUTH_LOGIN",
        actor_role=user.role,
        action="LOGIN_SUCCESS",
        status="SUCCESS",
        reason=f"User '{user.username}' successfully authenticated with role '{user.role}'"
    )

    access_token = create_access_token(data={
        "sub": user.username,
        "role": user.role,
        "email": user.email,
        "full_name": user.full_name
    })

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            full_name=user.full_name
        )
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_required_current_user)):
    """Get current authenticated user profile."""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        full_name=current_user.full_name
    )

@router.get("/users", response_model=List[UserResponse])
def get_available_users(db: Session = Depends(get_db)):
    """List available prototype users for testing multi-role workflows."""
    users = db.query(User).all()
    return [
        UserResponse(
            id=u.id,
            username=u.username,
            email=u.email,
            role=u.role,
            full_name=u.full_name
        ) for u in users
    ]
