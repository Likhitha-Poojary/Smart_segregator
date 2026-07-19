from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import logging

from app.config import MOCK_MODE, ALLOWED_ORIGINS
from app.db import init_db, close_db
from app.services.mqtt_client import start_mqtt_client, stop_mqtt_client
from app.services.mock_manager import start_mock_simulation
from app.routers import bins, alerts, ws

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing Smart Waste Segregation system services...")
    if MOCK_MODE:
        logger.info("MOCK_MODE=True. Bypassing MongoDB/MQTT connections, initiating background simulator...")
        asyncio.create_task(start_mock_simulation())
    else:
        logger.info("MOCK_MODE=False. Establishing MongoDB connection...")
        await init_db()
        
        logger.info("Starting MQTT broker subscription loops...")
        loop = asyncio.get_running_loop()
        start_mqtt_client(loop)
    
    yield
    
    # Shutdown actions
    logger.info("Stopping Smart Waste Segregation system services...")
    if not MOCK_MODE:
        stop_mqtt_client()
        await close_db()

app = FastAPI(
    title="Smart IoT Waste Segregation System API",
    version="1.0.0",
    lifespan=lifespan
)

# Allow CORS for easy local dashboard connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials="*" not in ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(bins.router)
app.include_router(alerts.router)
app.include_router(ws.router)

@app.get("/")
def read_root():
    return {
        "status": "healthy", 
        "mode": "mock" if MOCK_MODE else "real",
        "project": "Smart IoT Waste Segregation System",
        "documentation": "/docs"
    }
