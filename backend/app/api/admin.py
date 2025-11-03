from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session
from pathlib import Path
import shutil
from typing import List
from datetime import datetime

from app.api.deps import require_admin
from app.schemas.user import UserOut
from app.schemas.files import CSVOut
from app.models.user import User
from app.models.csv_file import CSVFile
from app.services.db import get_db

router = APIRouter(prefix="/admin", tags=["admin"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload", response_model=CSVOut)
def upload_csv(
    file: UploadFile = File(...),
    replace: bool = Query(False, description="Replace existing file with same filename"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    name = file.filename or ""
    if not name.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    existing = db.query(CSVFile).filter(CSVFile.filename == name).first()

    # Destination path (always write to uploads/<filename>)
    dest = UPLOAD_DIR / name

    if existing and not replace:
        # Stop duplicates by default
        raise HTTPException(status_code=409, detail="File already exists. Use ?replace=true to overwrite.")

    # Write the uploaded content to disk
    with dest.open("wb") as out:
        shutil.copyfileobj(file.file, out)

    if existing and replace:
        # Update record and keep the same id
        existing.path = str(dest)
        existing.uploaded_at = datetime.utcnow()
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    # Create new record
    rec = CSVFile(filename=name, path=str(dest))
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


@router.get("/users", response_model=List[UserOut])
def users(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.delete("/users/{user_id}")
def delete_user(user_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    u = db.query(User).filter_by(id=user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Not found")
    if u.is_admin:
        raise HTTPException(status_code=400, detail="Cannot delete admin")
    db.delete(u)
    db.commit()
    return {"ok": True}


@router.delete("/files/{file_id}")
def delete_file(file_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    rec = db.query(CSVFile).filter_by(id=file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Not found")
    try:
        Path(rec.path).unlink(missing_ok=True)
    except Exception:
        pass
    db.delete(rec)
    db.commit()
    return {"ok": True}
