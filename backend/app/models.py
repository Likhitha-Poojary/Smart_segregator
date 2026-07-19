from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Location(BaseModel):
    lat: float
    lng: float

class ChamberBreakdown(BaseModel):
    wet: float
    dry: float
    recyclable: float

class BinBase(BaseModel):
    id: str
    name: str
    location: Location
    threshold: float = 85.0

class BinCreate(BinBase):
    pass

class BinUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[Location] = None
    threshold: Optional[float] = None

class BinOut(BinBase):
    created_at: datetime
    fill_pct: float = 0.0
    status: str = "Normal"  # "Normal", "Watching", "Alert sent"
    last_updated: Optional[datetime] = None

class ReadingCreate(BaseModel):
    bin_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    fill_pct: float
    chamber_breakdown: ChamberBreakdown

class ClassificationEventCreate(BaseModel):
    bin_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    category: str
    confidence: float
    escalated_to_llm: bool = False

class AlertOut(BaseModel):
    bin_id: str
    bin_name: Optional[str] = None
    timestamp: datetime
    fill_pct_at_alert: float
    notified: bool
    channel: str
