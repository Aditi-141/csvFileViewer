from pydantic import BaseModel
from datetime import datetime

class CSVMeta(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    class Config: from_attributes = True

class CSVPage(BaseModel):
    columns: list[str]
    rows: list[list[str]]
    total_rows: int
