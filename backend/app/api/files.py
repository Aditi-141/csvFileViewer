# app/api/files.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_current_user
from app.schemas.files import CSVOut, CSVPreview
from app.models.csv_file import CSVFile
from app.services.db import get_db
from app.services.file_utils import preview_csv  # make sure this exists and does delimiter sniffing

# 👇 THIS MUST EXIST
router = APIRouter(prefix="/files", tags=["files"])

@router.get("", response_model=List[CSVOut])
def list_files(_: str = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(CSVFile).order_by(CSVFile.uploaded_at.desc()).all()

@router.get("/{file_id}", response_model=CSVPreview)
def file_preview(file_id: int, _: str = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = db.query(CSVFile).filter_by(id=file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")
    headers, rows = preview_csv(rec.path)  # returns headers, rows
    return CSVPreview(headers=headers, rows=rows)

@router.get("/{file_id}/download")
def download(file_id: int, _: str = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = db.query(CSVFile).filter_by(id=file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(rec.path, media_type="text/csv", filename=rec.filename)
