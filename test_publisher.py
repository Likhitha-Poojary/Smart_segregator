import time
import json
import random
import sys
import os
import paho.mqtt.client as mqtt

# Configuration
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))

print(f"Starting Smart IoT Waste Segregation Simulator...")
print(f"MQTT Broker: {MQTT_BROKER}:{MQTT_PORT}")

# Pre-defined bins configuration (lat/lng coordinates, thresholds)
BINS = {
    "bin_a": {
        "name": "Downtown Square (Bin A)",
        "fill_pct": 25.0,
        "lat": 12.9716,
        "lng": 77.5946,
        "threshold": 85.0
    },
    "bin_b": {
        "name": "Central Park (Bin B)",
        "fill_pct": 40.0,
        "lat": 12.9750,
        "lng": 77.5900,
        "threshold": 80.0
    },
    "bin_c": {
        "name": "Metro Station (Bin C)",
        "fill_pct": 65.0,
        "lat": 12.9690,
        "lng": 77.6010,
        "threshold": 90.0
    },
    "bin_d": {
        "name": "University Campus (Bin D)",
        "fill_pct": 10.0,
        "lat": 12.9800,
        "lng": 77.5850,
        "threshold": 85.0
    }
}

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

client = mqtt.Client()

# Connect to MQTT Broker
connected = False
for i in range(10):
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        connected = True
        print("Connected to MQTT broker successfully.")
        break
    except Exception as e:
        print(f"Connection attempt {i+1}/10 failed: {e}. Retrying in 3 seconds...")
        time.sleep(3)

if not connected:
    print("Could not connect to MQTT broker. Exiting.")
    sys.exit(1)

# Start network loop in background
client.loop_start()

try:
    step = 0
    while True:
        step += 1
        
        # 1. Update fill levels and publish telemetry for all bins
        for bin_id, bin_info in BINS.items():
            # Slowly fill up the bin
            # If the bin is full (e.g. >= 98%), empty it with 20% probability or when it exceeds 100%
            if bin_info["fill_pct"] >= 98.0:
                if random.random() < 0.25:
                    print(f"--- [CLEANUP] Simulating sanitation truck emptying {bin_info['name']} ---")
                    bin_info["fill_pct"] = random.uniform(5.0, 15.0)
                else:
                    # Hold at full level
                    bin_info["fill_pct"] = min(100.0, bin_info["fill_pct"] + random.uniform(0.1, 0.5))
            else:
                # Increment fill level: more variance for busy bins
                rate = random.uniform(1.0, 4.0) if bin_id in ["bin_a", "bin_c"] else random.uniform(0.5, 2.5)
                bin_info["fill_pct"] = min(100.0, bin_info["fill_pct"] + rate)

            # Generate random chamber breakdown (adds up to 100)
            wet_share = random.uniform(20, 50)
            dry_share = random.uniform(20, 50)
            rec_share = 100.0 - (wet_share + dry_share)
            
            telemetry = {
                "fill_pct": round(bin_info["fill_pct"], 1),
                "chamber_breakdown": {
                    "wet": round(wet_share, 1),
                    "dry": round(dry_share, 1),
                    "recyclable": round(rec_share, 1)
                }
            }
            
            topic = f"bins/{bin_id}/telemetry"
            client.publish(topic, json.dumps(telemetry))
            print(f"Published Telemetry: {topic} -> {telemetry['fill_pct']}%")

        # 2. Periodically publish waste classification events
        if step % 2 == 0:  # Every ~6 seconds
            active_bin = random.choice(list(BINS.keys()))
            item = random.choice(WASTE_CATEGORIES)
            
            # 15% probability of AI escalation (fallback)
            escalated = random.random() < 0.15
            if escalated:
                # Lower confidence for local model triggering fallback
                confidence = round(random.uniform(50.0, 72.0), 1)
            else:
                confidence = round(random.uniform(82.0, 99.5), 1)
                
            classification = {
                "category": item["group"],
                "confidence": confidence,
                "escalated_to_llm": escalated
            }
            
            topic = f"bins/{active_bin}/classifications"
            client.publish(topic, json.dumps(classification))
            print(f"Published Classification: {topic} -> Item: {item['name']}, Group: {item['group']}, Conf: {confidence}%, Escalated: {escalated}")

        # Sleep between iterations
        time.sleep(3.0)

except KeyboardInterrupt:
    print("Stopping simulator...")
finally:
    client.loop_stop()
    client.disconnect()
    print("Simulator stopped.")
