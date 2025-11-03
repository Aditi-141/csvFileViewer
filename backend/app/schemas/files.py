from pydantic import BaseModel
from datetime import datetime

class CSVOut(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    class Config:
        from_attributes = True

class CSVPreview(BaseModel):
    headers: list[str]
    rows: list[list[str]]
