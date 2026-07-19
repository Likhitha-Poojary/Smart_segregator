import paho.mqtt.client as mqtt
import json
import logging
from datetime import datetime
from app.config import MQTT_BROKER, MQTT_PORT
from app.db import get_db
from app.services.alert_service import trigger_alert_if_needed
from app.services.websocket_manager import manager
import asyncio

logger = logging.getLogger(__name__)

# MQTT client
mqtt_client = mqtt.Client()
main_loop = None

def on_connect(client, userdata, flags, rc):
    logger.info(f"Connected to MQTT broker with result code {rc}")
    client.subscribe("bins/+/telemetry")
    client.subscribe("bins/+/classifications")

def on_message(client, userdata, msg):
    if main_loop is None:
        logger.error("Main loop is not initialized in MQTT client")
        return
    
    topic = msg.topic
    payload = msg.payload.decode()
    
    # Run the processing logic in the main loop thread-safely
    asyncio.run_coroutine_threadsafe(
        process_mqtt_message(topic, payload),
        main_loop
    )

async def process_mqtt_message(topic: str, payload_str: str):
    db = get_db()
    try:
        data = json.loads(payload_str)
    except Exception as e:
        logger.error(f"Error parsing MQTT JSON: {e}")
        return

    # Topic format: bins/{bin_id}/telemetry or bins/{bin_id}/classifications
    parts = topic.split('/')
    if len(parts) < 3:
        return
    
    bin_id = parts[1]
    
    # Find bin or create mock if it's first telemetry
    bin_doc = await db.bins.find_one({"id": bin_id})
    if not bin_doc:
        bin_doc = {
            "id": bin_id,
            "name": f"Bin {bin_id.upper()}",
            "location": {
                "lat": 12.9716 + (hash(bin_id) % 100) * 0.0002, 
                "lng": 77.5946 + (hash(bin_id) % 100) * 0.0002
            },
            "threshold": 85.0,
            "status": "Normal",
            "fill_pct": 0.0,
            "created_at": datetime.utcnow(),
            "last_updated": datetime.utcnow()
        }
        await db.bins.insert_one(bin_doc)
        logger.info(f"Auto-created bin {bin_id} from telemetry.")

    if parts[2] == "telemetry":
        fill_pct = float(data.get("fill_pct", 0.0))
        chamber = data.get("chamber_breakdown", {"wet": 0.0, "dry": 0.0, "recyclable": 0.0})
        
        # Save reading to history
        reading_doc = {
            "bin_id": bin_id,
            "timestamp": datetime.utcnow(),
            "fill_pct": fill_pct,
            "chamber_breakdown": chamber
        }
        await db.readings.insert_one(reading_doc)
        
        # Verify alert threshold and update cache
        await trigger_alert_if_needed(db, bin_doc, fill_pct)
        
    elif parts[2] == "classifications":
        category = data.get("category", "Unknown")
        confidence = float(data.get("confidence", 100.0))
        escalated_to_llm = bool(data.get("escalated_to_llm", False))
        
        event_doc = {
            "bin_id": bin_id,
            "bin_name": bin_doc.get("name", bin_id),
            "timestamp": datetime.utcnow(),
            "category": category,
            "confidence": confidence,
            "escalated_to_llm": escalated_to_llm
        }
        await db.classification_events.insert_one(event_doc)
        
        # Broadcast classification to UI
        ws_payload = {
            "event": "classification_event",
            "data": {
                "bin_id": bin_id,
                "bin_name": bin_doc.get("name", bin_id),
                "timestamp": event_doc["timestamp"].isoformat(),
                "category": category,
                "confidence": confidence,
                "escalated_to_llm": escalated_to_llm
            }
        }
        await manager.broadcast(ws_payload)

def start_mqtt_client(loop):
    global main_loop
    main_loop = loop
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    
    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
        logger.info(f"MQTT client connected to {MQTT_BROKER}:{MQTT_PORT} and started loop")
    except Exception as e:
        logger.error(f"Failed to connect and start MQTT client: {e}")

def stop_mqtt_client():
    try:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        logger.info("MQTT client disconnected.")
    except Exception as e:
        logger.error(f"Error disconnecting MQTT client: {e}")
