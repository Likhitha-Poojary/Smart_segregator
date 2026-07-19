from fastapi import APIRouter, HTTPException, Query
from typing import List
from datetime import datetime, timedelta
import random
from app.db import get_db
from app.models import BinCreate, BinUpdate, BinOut
from app.config import MOCK_MODE
from app.services import mock_manager

router = APIRouter(prefix="/bins", tags=["bins"])

async def serialize_bin(doc) -> dict:
    return {
        "id": doc["id"],
        "name": doc["name"],
        "location": doc["location"],
        "threshold": doc.get("threshold", 85.0),
        "created_at": doc["created_at"],
        "fill_pct": doc.get("fill_pct", 0.0),
        "status": doc.get("status", "Normal"),
        "last_updated": doc.get("last_updated")
    }

@router.get("", response_model=List[BinOut])
async def get_bins():
    if MOCK_MODE:
        return [await serialize_bin(b) for b in mock_manager.bins_db]
        
    db = get_db()
    cursor = db.bins.find()
    bins = []
    async for doc in cursor:
        bins.append(await serialize_bin(doc))
    return bins

@router.get("/{bin_id}", response_model=BinOut)
async def get_bin(bin_id: str):
    if MOCK_MODE:
        match = next((b for b in mock_manager.bins_db if b["id"] == bin_id), None)
        if not match:
            raise HTTPException(status_code=404, detail="Bin not found")
        return await serialize_bin(match)
        
    db = get_db()
    doc = await db.bins.find_one({"id": bin_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Bin not found")
    return await serialize_bin(doc)

@router.post("", response_model=BinOut)
async def create_bin(bin_in: BinCreate):
    if MOCK_MODE:
        existing = any(b["id"] == bin_in.id for b in mock_manager.bins_db)
        if existing:
            raise HTTPException(status_code=400, detail="Bin with this ID already exists")
        
        doc = bin_in.dict()
        doc["created_at"] = datetime.utcnow()
        doc["last_updated"] = datetime.utcnow()
        doc["fill_pct"] = 0.0
        doc["status"] = "Normal"
        
        mock_manager.bins_db.append(doc)
        return await serialize_bin(doc)
        
    db = get_db()
    existing = await db.bins.find_one({"id": bin_in.id})
    if existing:
        raise HTTPException(status_code=400, detail="Bin with this ID already exists")
    
    doc = bin_in.dict()
    doc["created_at"] = datetime.utcnow()
    doc["last_updated"] = datetime.utcnow()
    doc["fill_pct"] = 0.0
    doc["status"] = "Normal"
    
    await db.bins.insert_one(doc)
    return await serialize_bin(doc)

@router.put("/{bin_id}", response_model=BinOut)
async def update_bin(bin_id: str, bin_update: BinUpdate):
    if MOCK_MODE:
        match = next((b for b in mock_manager.bins_db if b["id"] == bin_id), None)
        if not match:
            raise HTTPException(status_code=404, detail="Bin not found")
            
        update_data = {k: v for k, v in bin_update.dict().items() if v is not None}
        for k, v in update_data.items():
            match[k] = v
        match["last_updated"] = datetime.utcnow()
        return await serialize_bin(match)
        
    db = get_db()
    existing = await db.bins.find_one({"id": bin_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Bin not found")
    
    update_data = {k: v for k, v in bin_update.dict().items() if v is not None}
    if update_data:
        update_data["last_updated"] = datetime.utcnow()
        await db.bins.update_one({"id": bin_id}, {"$set": update_data})
        
    updated = await db.bins.find_one({"id": bin_id})
    return await serialize_bin(updated)

@router.get("/{bin_id}/history")
async def get_bin_history(bin_id: str, hours: int = Query(24, ge=1)):
    if MOCK_MODE:
        match = any(b["id"] == bin_id for b in mock_manager.bins_db)
        if not match:
            raise HTTPException(status_code=404, detail="Bin not found")
            
        start_time = datetime.utcnow() - timedelta(hours=hours)
        filtered = [
            r for r in mock_manager.readings_db 
            if r["bin_id"] == bin_id and r["timestamp"] >= start_time
        ]
        filtered.sort(key=lambda x: x["timestamp"])
        return [{
            "timestamp": r["timestamp"].isoformat(),
            "fill_pct": r["fill_pct"],
            "chamber_breakdown": r["chamber_breakdown"]
        } for r in filtered]
        
    db = get_db()
    bin_doc = await db.bins.find_one({"id": bin_id})
    if not bin_doc:
        raise HTTPException(status_code=404, detail="Bin not found")
    
    start_time = datetime.utcnow() - timedelta(hours=hours)
    cursor = db.readings.find(
        {"bin_id": bin_id, "timestamp": {"$gte": start_time}}
    ).sort("timestamp", 1)
    
    readings = []
    async for doc in cursor:
        readings.append({
            "timestamp": doc["timestamp"].isoformat(),
            "fill_pct": doc["fill_pct"],
            "chamber_breakdown": doc["chamber_breakdown"]
        })
    return readings

@router.get("/{bin_id}/events")
async def get_bin_events(bin_id: str):
    if MOCK_MODE:
        match = next((b for b in mock_manager.bins_db if b["id"] == bin_id), None)
        if not match:
            raise HTTPException(status_code=404, detail="Bin not found")
            
        filtered = [e for e in mock_manager.events_db if e["bin_id"] == bin_id]
        filtered.sort(key=lambda x: x["timestamp"], reverse=True)
        return [{
            "bin_id": e["bin_id"],
            "bin_name": e.get("bin_name", match["name"]),
            "timestamp": e["timestamp"].isoformat(),
            "category": e["category"],
            "confidence": e["confidence"],
            "escalated_to_llm": e.get("escalated_to_llm", False)
        } for e in filtered]
        
    db = get_db()
    bin_doc = await db.bins.find_one({"id": bin_id})
    if not bin_doc:
        raise HTTPException(status_code=404, detail="Bin not found")
        
    cursor = db.classification_events.find({"bin_id": bin_id}).sort("timestamp", -1).limit(50)
    events = []
    async for doc in cursor:
        events.append({
            "bin_id": doc["bin_id"],
            "bin_name": doc.get("bin_name", bin_doc.get("name")),
            "timestamp": doc["timestamp"].isoformat(),
            "category": doc["category"],
            "confidence": doc["confidence"],
            "escalated_to_llm": doc.get("escalated_to_llm", False)
        })
    return events

# --- Simulation Trigger Endpoints (Mock Mode Only) ---

@router.post("/{bin_id}/empty")
async def empty_bin_trigger(bin_id: str):
    if not MOCK_MODE:
        raise HTTPException(status_code=400, detail="Simulator triggers only available in MOCK_MODE.")
    
    match = next((b for b in mock_manager.bins_db if b["id"] == bin_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Bin not found")
        
    match["fill_pct"] = float(random.uniform(4.0, 10.0))
    match["status"] = "Normal"
    match["last_updated"] = datetime.utcnow()
    
    reading = {
        "bin_id": bin_id,
        "timestamp": datetime.utcnow(),
        "fill_pct": match["fill_pct"],
        "chamber_breakdown": {"wet": 30.0, "dry": 35.0, "recyclable": 35.0}
    }
    mock_manager.readings_db.append(reading)
    
    from app.services.websocket_manager import manager
    await manager.broadcast({
        "event": "bin_updated",
        "data": {
            "id": match["id"],
            "name": match["name"],
            "location": match["location"],
            "threshold": match["threshold"],
            "fill_pct": match["fill_pct"],
            "status": match["status"],
            "last_updated": match["last_updated"].isoformat()
        }
    })
    return {"status": "success", "fill_pct": match["fill_pct"]}

@router.post("/{bin_id}/fill")
async def fill_bin_trigger(bin_id: str):
    if not MOCK_MODE:
        raise HTTPException(status_code=400, detail="Simulator triggers only available in MOCK_MODE.")
        
    match = next((b for b in mock_manager.bins_db if b["id"] == bin_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Bin not found")
        
    match["fill_pct"] = float(random.uniform(92.0, 97.0))
    match["status"] = "Alert sent"
    match["last_updated"] = datetime.utcnow()
    
    reading = {
        "bin_id": bin_id,
        "timestamp": datetime.utcnow(),
        "fill_pct": match["fill_pct"],
        "chamber_breakdown": {"wet": 45.0, "dry": 20.0, "recyclable": 35.0}
    }
    mock_manager.readings_db.append(reading)
    
    alert = {
        "bin_id": bin_id,
        "bin_name": match["name"],
        "timestamp": datetime.utcnow(),
        "fill_pct_at_alert": match["fill_pct"],
        "notified": True,
        "channel": "webhook"
    }
    mock_manager.alerts_db.insert(0, alert)
    
    from app.services.websocket_manager import manager
    await manager.broadcast({
        "event": "bin_updated",
        "data": {
            "id": match["id"],
            "name": match["name"],
            "location": match["location"],
            "threshold": match["threshold"],
            "fill_pct": match["fill_pct"],
            "status": match["status"],
            "last_updated": match["last_updated"].isoformat()
        }
    })
    await manager.broadcast({
        "event": "alert_triggered",
        "data": {
            "bin_id": bin_id,
            "bin_name": match["name"],
            "timestamp": alert["timestamp"].isoformat(),
            "fill_pct_at_alert": alert["fill_pct_at_alert"],
            "notified": alert["notified"],
            "channel": alert["channel"]
        }
    })
    return {"status": "success", "fill_pct": match["fill_pct"]}

@router.post("/{bin_id}/classify")
async def classify_bin_trigger(
    bin_id: str, 
    category: str = "Recyclable", 
    confidence: float = 95.0, 
    escalated: bool = False
):
    if not MOCK_MODE:
        raise HTTPException(status_code=400, detail="Simulator triggers only available in MOCK_MODE.")
        
    match = next((b for b in mock_manager.bins_db if b["id"] == bin_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Bin not found")
        
    event = {
        "bin_id": bin_id,
        "bin_name": match["name"],
        "timestamp": datetime.utcnow(),
        "category": category,
        "confidence": confidence,
        "escalated_to_llm": escalated
    }
    mock_manager.events_db.insert(0, event)
    
    from app.services.websocket_manager import manager
    await manager.broadcast({
        "event": "classification_event",
        "data": {
            "bin_id": bin_id,
            "bin_name": match["name"],
            "timestamp": event["timestamp"].isoformat(),
            "category": event["category"],
            "confidence": event["confidence"],
            "escalated_to_llm": event["escalated_to_llm"]
        }
    })
    return {"status": "success", "event": event}
