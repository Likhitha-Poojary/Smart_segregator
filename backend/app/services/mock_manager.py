import asyncio
import random
import logging
from datetime import datetime
from app.services.websocket_manager import manager

logger = logging.getLogger(__name__)

# In-memory storage structures for Mock Mode
bins_db = [
    {
        "id": "bin_a",
        "name": "Downtown Square (Bin A)",
        "location": {"lat": 12.9716, "lng": 77.5946},
        "threshold": 85.0,
        "fill_pct": 25.0,
        "status": "Normal",
        "created_at": datetime.utcnow(),
        "last_updated": datetime.utcnow()
    },
    {
        "id": "bin_b",
        "name": "Central Park (Bin B)",
        "location": {"lat": 12.9750, "lng": 77.5900},
        "threshold": 80.0,
        "fill_pct": 40.0,
        "status": "Normal",
        "created_at": datetime.utcnow(),
        "last_updated": datetime.utcnow()
    },
    {
        "id": "bin_c",
        "name": "Metro Station (Bin C)",
        "location": {"lat": 12.9690, "lng": 77.6010},
        "threshold": 90.0,
        "fill_pct": 65.0,
        "status": "Watching",
        "created_at": datetime.utcnow(),
        "last_updated": datetime.utcnow()
    },
    {
        "id": "bin_d",
        "name": "University Campus (Bin D)",
        "location": {"lat": 12.9800, "lng": 77.5850},
        "threshold": 85.0,
        "fill_pct": 10.0,
        "status": "Normal",
        "created_at": datetime.utcnow(),
        "last_updated": datetime.utcnow()
    }
]

readings_db = []
events_db = []
alerts_db = []

WASTE_CATEGORIES = [
    {"name": "Plastic Bottle", "group": "Recyclable"},
    {"name": "Aluminum Can", "group": "Recyclable"},
    {"name": "Cardboard Box", "group": "Recyclable"},
    {"name": "Food Waste", "group": "Wet"},
    {"name": "Apple Core", "group": "Wet"},
    {"name": "Coffee Grounds", "group": "Wet"},
    {"name": "Paper Napkin", "group": "Dry"},
    {"name": "Styrofoam Cup", "group": "Dry"},
    {"name": "Plastic Wrapper", "group": "Dry"}
]

async def start_mock_simulation():
    logger.info("Smart Waste Segregator simulator active (in-memory mode).")
    step = 0
    while True:
        try:
            step += 1
            # 1. Update fill levels
            for bin_doc in bins_db:
                prev_status = bin_doc["status"]
                
                # Slowly fill up or empty
                if bin_doc["fill_pct"] >= 98.0:
                    if random.random() < 0.25:
                        logger.info(f"Simulating truck emptying: {bin_doc['name']}")
                        bin_doc["fill_pct"] = random.uniform(5.0, 15.0)
                    else:
                        bin_doc["fill_pct"] = min(100.0, bin_doc["fill_pct"] + random.uniform(0.1, 0.5))
                else:
                    rate = random.uniform(1.0, 4.0) if bin_doc["id"] in ["bin_a", "bin_c"] else random.uniform(0.5, 2.5)
                    bin_doc["fill_pct"] = min(100.0, bin_doc["fill_pct"] + rate)

                # Determine status
                new_status = "Normal"
                if bin_doc["fill_pct"] > bin_doc["threshold"]:
                    new_status = "Alert sent"
                elif bin_doc["fill_pct"] >= 60.0:
                    new_status = "Watching"
                
                bin_doc["status"] = new_status
                bin_doc["last_updated"] = datetime.utcnow()

                # Add reading log
                wet_share = random.uniform(20, 50)
                dry_share = random.uniform(20, 50)
                rec_share = 100.0 - (wet_share + dry_share)
                
                reading = {
                    "bin_id": bin_doc["id"],
                    "timestamp": datetime.utcnow(),
                    "fill_pct": bin_doc["fill_pct"],
                    "chamber_breakdown": {
                        "wet": round(wet_share, 1),
                        "dry": round(dry_share, 1),
                        "recyclable": round(rec_share, 1)
                    }
                }
                readings_db.append(reading)

                # Cap readings array size in memory
                if len(readings_db) > 1000:
                    readings_db.pop(0)

                # Broadcast live status update to WebSocket client
                ws_payload = {
                    "event": "bin_updated",
                    "data": {
                        "id": bin_doc["id"],
                        "name": bin_doc["name"],
                        "location": bin_doc["location"],
                        "threshold": bin_doc["threshold"],
                        "fill_pct": bin_doc["fill_pct"],
                        "status": bin_doc["status"],
                        "last_updated": bin_doc["last_updated"].isoformat()
                    }
                }
                await manager.broadcast(ws_payload)

                # Alert transition
                if new_status == "Alert sent" and prev_status != "Alert sent":
                    alert = {
                        "bin_id": bin_doc["id"],
                        "bin_name": bin_doc["name"],
                        "timestamp": datetime.utcnow(),
                        "fill_pct_at_alert": bin_doc["fill_pct"],
                        "notified": True,
                        "channel": "webhook"
                    }
                    alerts_db.insert(0, alert)
                    if len(alerts_db) > 100:
                        alerts_db.pop()

                    # Broadcast alert
                    alert_ws_payload = {
                        "event": "alert_triggered",
                        "data": {
                            "bin_id": bin_doc["id"],
                            "bin_name": bin_doc["name"],
                            "timestamp": alert["timestamp"].isoformat(),
                            "fill_pct_at_alert": alert["fill_pct_at_alert"],
                            "notified": alert["notified"],
                            "channel": alert["channel"]
                        }
                    }
                    await manager.broadcast(alert_ws_payload)

            # 2. Periodically publish classification events
            if step % 2 == 0:
                active_bin = random.choice(bins_db)
                item = random.choice(WASTE_CATEGORIES)
                escalated = random.random() < 0.15
                confidence = round(random.uniform(50.0, 72.0), 1) if escalated else round(random.uniform(82.0, 99.5), 1)

                event = {
                    "bin_id": active_bin["id"],
                    "bin_name": active_bin["name"],
                    "timestamp": datetime.utcnow(),
                    "category": item["group"],
                    "confidence": confidence,
                    "escalated_to_llm": escalated
                }
                events_db.insert(0, event)
                if len(events_db) > 200:
                    events_db.pop()

                # Broadcast event
                ws_payload = {
                    "event": "classification_event",
                    "data": {
                        "bin_id": active_bin["id"],
                        "bin_name": active_bin["name"],
                        "timestamp": event["timestamp"].isoformat(),
                        "category": event["category"],
                        "confidence": event["confidence"],
                        "escalated_to_llm": event["escalated_to_llm"]
                    }
                }
                await manager.broadcast(ws_payload)

            await asyncio.sleep(3.0)
        except Exception as e:
            logger.error(f"Error in mock simulation loop: {e}")
            await asyncio.sleep(3.0)
