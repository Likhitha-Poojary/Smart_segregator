import httpx
import logging
from datetime import datetime
from app.config import TWILIO_WEBHOOK_URL
from app.services.websocket_manager import manager

logger = logging.getLogger(__name__)

async def trigger_alert_if_needed(db, bin_doc: dict, fill_pct: float):
    bin_id = bin_doc["id"]
    bin_name = bin_doc["name"]
    threshold = bin_doc.get("threshold", 85.0)
    current_status = bin_doc.get("status", "Normal")
    
    # Determine new status based on fill level and threshold
    new_status = "Normal"
    if fill_pct > threshold:
        new_status = "Alert sent"
    elif fill_pct >= 60.0:
        new_status = "Watching"
        
    # Check if we need to send an alert (transitioning into "Alert sent" status)
    send_webhook = (new_status == "Alert sent" and current_status != "Alert sent")
    
    # Update the bin status and latest reading cache in MongoDB
    await db.bins.update_one(
        {"id": bin_id},
        {
            "$set": {
                "fill_pct": fill_pct,
                "status": new_status,
                "last_updated": datetime.utcnow()
            }
        }
    )
    
    # If the state changed, notify WS clients about the bin status change
    ws_payload = {
        "event": "bin_updated",
        "data": {
            "id": bin_id,
            "name": bin_name,
            "location": bin_doc["location"],
            "threshold": threshold,
            "fill_pct": fill_pct,
            "status": new_status,
            "last_updated": datetime.utcnow().isoformat()
        }
    }
    await manager.broadcast(ws_payload)

    if send_webhook:
        logger.info(f"Threshold exceeded for Bin {bin_name} ({fill_pct}% > {threshold}%). Triggering alert webhook...")
        notified = False
        channel = "webhook"
        
        # Trigger SMS/Email webhook
        payload = {
            "bin_id": bin_id,
            "bin_name": bin_name,
            "fill_pct_at_alert": fill_pct,
            "threshold": threshold,
            "timestamp": datetime.utcnow().isoformat(),
            "message": f"Alert! Bin '{bin_name}' (ID: {bin_id}) fill level has crossed the {threshold}% threshold. Current: {fill_pct:.1f}%."
        }
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(TWILIO_WEBHOOK_URL, json=payload)
                if response.status_code in [200, 201, 202]:
                    notified = True
                    logger.info("Alert webhook triggered successfully.")
                else:
                    logger.warning(f"Alert webhook failed with status code {response.status_code}")
        except Exception as e:
            logger.error(f"Failed to connect to alert webhook: {e}")
            
        # Log alert to database
        alert_doc = {
            "bin_id": bin_id,
            "bin_name": bin_name,
            "timestamp": datetime.utcnow(),
            "fill_pct_at_alert": fill_pct,
            "notified": notified,
            "channel": channel
        }
        await db.alerts.insert_one(alert_doc)
        
        # Broadcast the alert event to all frontend clients
        alert_ws_payload = {
            "event": "alert_triggered",
            "data": {
                "bin_id": bin_id,
                "bin_name": bin_name,
                "timestamp": alert_doc["timestamp"].isoformat(),
                "fill_pct_at_alert": fill_pct,
                "notified": notified,
                "channel": channel
            }
        }
        await manager.broadcast(alert_ws_payload)
