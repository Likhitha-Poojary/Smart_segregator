from fastapi import APIRouter
from typing import List
from app.db import get_db
from app.models import AlertOut
from app.config import MOCK_MODE
from app.services import mock_manager

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("", response_model=List[AlertOut])
async def get_alerts():
    if MOCK_MODE:
        return [{
            "bin_id": doc["bin_id"],
            "bin_name": doc.get("bin_name", doc["bin_id"]),
            "timestamp": doc["timestamp"],
            "fill_pct_at_alert": doc["fill_pct_at_alert"],
            "notified": doc.get("notified", False),
            "channel": doc.get("channel", "webhook")
        } for doc in mock_manager.alerts_db]

    db = get_db()
    cursor = db.alerts.find().sort("timestamp", -1).limit(100)
    alerts = []
    async for doc in cursor:
        alerts.append({
            "bin_id": doc["bin_id"],
            "bin_name": doc.get("bin_name", doc["bin_id"]),
            "timestamp": doc["timestamp"],
            "fill_pct_at_alert": doc["fill_pct_at_alert"],
            "notified": doc.get("notified", False),
            "channel": doc.get("channel", "webhook")
        })
    return alerts
