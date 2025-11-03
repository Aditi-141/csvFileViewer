from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.services.db import Base, engine, get_db
from app.core.config import ADMIN_USERNAME, ADMIN_PASSWORD
from app.core.security import hash_password
from app.models.user import User
from app.api import auth as auth_router
from app.api import files as files_router
from app.api import admin as admin_router

app = FastAPI(title="CSV Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB tables
Base.metadata.create_all(bind=engine)

# Seed admin
with next(get_db()) as db:  # type: ignore
    if not db.query(User).filter_by(username=ADMIN_USERNAME).first():
        db.add(User(username=ADMIN_USERNAME, password_hash=hash_password(ADMIN_PASSWORD), is_admin=True))
        db.commit()

# Routers
app.include_router(auth_router.router)
app.include_router(files_router.router)
app.include_router(admin_router.router)

@app.get("/")
def root():
    return {"ok": True, "service": "csv-dashboard"}
