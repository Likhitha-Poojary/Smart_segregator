from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGO_URI, MONGO_DB_NAME
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

def get_db():
    if db_instance.db is None:
        db_instance.client = AsyncIOMotorClient(MONGO_URI)
        db_instance.db = db_instance.client[MONGO_DB_NAME]
    return db_instance.db

async def init_db():
    try:
        db = get_db()
        # Create indexes
        await db.bins.create_index("id", unique=True)
        await db.readings.create_index([("bin_id", 1), ("timestamp", -1)])
        await db.classification_events.create_index([("bin_id", 1), ("timestamp", -1)])
        await db.alerts.create_index([("bin_id", 1), ("timestamp", -1)])
        logger.info("MongoDB initialized and indexes verified.")
    except Exception as e:
        logger.error(f"Error initializing MongoDB: {e}")

async def close_db():
    if db_instance.client is not None:
        db_instance.client.close()
        db_instance.client = None
        db_instance.db = None
        logger.info("MongoDB connection closed.")
