# app/api/admin.py
from __future__ import annotations

import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.api.deps import admin_required
from app.services.db import get_db
from app.models.user import User
from app.models.csv_file import CSVFile

# choose an upload dir (env override allowed)
UPLOAD_ROOT = Path(os.getenv("UPLOAD_DIR", "uploads")).resolve()

router = APIRouter(prefix="/admin", tags=["admin"])

# ---------- Users ----------

@router.get("/users", response_model=List[Dict[str, Any]])
def list_users(_: User = Depends(admin_required), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id.asc()).all()
    out: List[Dict[str, Any]] = []
    for u in users:
        created_raw = getattr(u, "created_at", None) or getattr(u, "created_on", None)
        last_login_raw = getattr(u, "last_login", None)
        out.append({
            "id": u.id,
            "username": u.username,
            "is_admin": u.is_admin,
            "created_at": created_raw.isoformat() if created_raw else None,
            "last_login": last_login_raw.isoformat() if last_login_raw else None,
        })
    return out

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current: User = Depends(admin_required),
    db: Session = Depends(get_db),
):
    # Prevent deleting yourself
    if getattr(current, "id", None) == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete yourself")

    # Robust delete: affect rows directly, avoid session identity-map quirks
    rows = db.query(User).filter(User.id == user_id).delete(synchronize_session=False)
    db.commit()

    if rows == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {"ok": True, "deleted_user_id": user_id}

# ---------- Files (list + delete) ----------

@router.get("/files", response_model=List[Dict[str, Any]])
def admin_list_files(_: User = Depends(admin_required), db: Session = Depends(get_db)):
    files = db.query(CSVFile).order_by(CSVFile.uploaded_at.desc()).all()
    return [{"id": f.id, "filename": f.filename, "uploaded_at": f.uploaded_at} for f in files]

@router.delete("/files/{file_id}")
def delete_file(file_id: int, _: User = Depends(admin_required), db: Session = Depends(get_db)):
    rec = db.query(CSVFile).filter(CSVFile.id == file_id).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    # remove from disk if present
    p = Path(rec.path)
    try:
        if p.exists():
            p.unlink()
    except Exception:
        # optionally log
        pass

    db.delete(rec)
    db.commit()
    return {"ok": True, "deleted_id": file_id}

# ---------- Upload CSV (with replace support) ----------

@router.post("/upload")
async def admin_upload_csv(
    file: UploadFile = File(...),
    replace: bool = Query(False),
    _: User = Depends(admin_required),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)

    original_name = Path(file.filename).name
    existing = db.query(CSVFile).filter(CSVFile.filename == original_name).first()

    if existing:
        if not replace:
            raise HTTPException(
                status_code=409,
                detail="File already exists. Re-upload with ?replace=true to overwrite.",
            )
        # overwrite existing file contents
        dest = Path(existing.path)
        try:
            if dest.exists():
                dest.unlink()
        except Exception:
            pass

        data = await file.read()
        dest.parent.mkdir(parents=True, exist_ok=True)
        with dest.open("wb") as out:
            out.write(data)

        existing.uploaded_at = datetime.utcnow()
        existing.path = str(dest)
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return {"id": existing.id, "filename": existing.filename, "uploaded_at": existing.uploaded_at}

    # create new record + unique filename on disk
    unique_name = f"{uuid.uuid4()}_{original_name}"
    dest = UPLOAD_ROOT / unique_name
    data = await file.read()
    with dest.open("wb") as out:
        out.write(data)

    rec = CSVFile(filename=original_name, path=str(dest))
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return {"id": rec.id, "filename": rec.filename, "uploaded_at": rec.uploaded_at}
