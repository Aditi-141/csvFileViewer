from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.services.db import Base  # <-- FIXED: services.db

class CSVFile(Base):
    __tablename__ = "csv_files"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    path = Column(Text, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
