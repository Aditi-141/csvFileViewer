from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.auth import Credentials, TokenResponse
from app.schemas.user import UserOut
from app.models.user import User
from app.services.db import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=TokenResponse)
def signup(payload: Credentials, db: Session = Depends(get_db)):
    if db.query(User).filter_by(username=payload.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    user = User(username=payload.username, password_hash=hash_password(payload.password), is_admin=False)
    db.add(user)
    db.commit()
    token = create_access_token(sub=user.username, is_admin=user.is_admin)
    return TokenResponse(access_token=token, username=user.username, is_admin=user.is_admin)

@router.post("/login", response_model=TokenResponse)
def login(payload: Credentials, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(username=payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(sub=user.username, is_admin=user.is_admin)
    return TokenResponse(access_token=token, username=user.username, is_admin=user.is_admin)

@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
