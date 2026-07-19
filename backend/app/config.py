import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB", "smart_waste_db")

MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))

# SMS/Email notification webhook url (e.g. Twilio hook or mock bin)
TWILIO_WEBHOOK_URL = os.getenv("TWILIO_WEBHOOK_URL", "http://httpbin.org/post")

# Enable in-memory Mock Mode if explicitly set to "true" (defaults to "true" for direct local runs)
MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"
