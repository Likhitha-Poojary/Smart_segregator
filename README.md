# Smart IoT Waste Segregation & Segregator System

A production-ready, real-time IoT monitoring and control dashboard for a Smart Waste Segregator system. It monitors smart bin fill capacities, tracks waste stream chamber breakdowns (Wet/Organic, Dry, Recyclable), alerts sanitation workers on capacity thresholds via webhook, and logs edge-based AI classification events (with automatic LLM fallback verification when camera confidence is low).

## 🚀 Key Features

* **Real-time Telemetry Monitor**: Tracks live sensor data (fill percentage and chamber composition) streaming from active bin nodes.
* **Interactive Map View**: Geolocation visualization of all deployed smart bins with color-coded alerts based on fill thresholds.
* **Live Classifications Feed**: Shows real-time waste items analyzed at bin inlets (plastic bottle, apple core, etc.) and logs if AI fallback logic was triggered.
* **Sustainability & Impact Analytics**: Aggregates environmental metrics like CO₂ emission prevented, trees saved, energy saved, and accuracy per node.
* **Remote Simulation Controls**: Built-in test controllers to manually force bin emptying, overfilling, or mock AI classifications from the UI.
* **Production-Grade Containerization**: Multi-stage Docker builds serving static React assets via Nginx on port 80 and reverse-proxying API/WebSocket requests to the FastAPI backend.

---

## 🛠️ Technology Stack

### Backend
* **FastAPI**: High performance Python web framework.
* **Motor**: Asynchronous Python driver for MongoDB.
* **Paho-MQTT**: Client library for broker subscription loops.
* **MongoDB**: NoSQL database for logging time-series sensor readings, classifications, and alerts.
* **Mosquitto**: MQTT broker for receiving IoT device telemetry.

### Frontend
* **React + Vite**: Fast SPA building pipeline.
* **TailwindCSS (v4)**: Modern, highly responsive utility styling.
* **Leaflet + React-Leaflet**: Interactive map rendering.
* **Recharts**: Responsive charting library for historical logs and aggregates.
* **Lucide-React**: Premium icon system.

---

## 📦 Getting Started & Running

The application is fully containerized with Docker Compose.

### Prerequisites
* Docker and Docker Compose installed.
* Python 3.10+ (optional, only for running the standalone test simulator).

### Running with Docker Compose

1. **Clone the repository** (if not already done).
2. **Build and start the services**:
   ```bash
   docker-compose up --build
   ```
   This command starts the following containers:
   * **`iot_mongodb`** (MongoDB on `localhost:27017`)
   * **`iot_mosquitto`** (Mosquitto MQTT on `localhost:1883`)
   * **`iot_backend`** (FastAPI backend on `localhost:8000`)
   * **`iot_frontend`** (Nginx + compiled static React files on `localhost:5173`)

3. **Access the services**:
   * Open the Dashboard: **[http://localhost:5173](http://localhost:5173)**
   * View the API Swagger docs: **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

## 📡 Simulating Live IoT Devices

Once Docker Compose is running, the backend waits for real MQTT telemetry. You can run the included Python simulation publisher to feed live data into the pipeline:

1. Navigate to the project root directory.
2. Install dependencies (specifically `paho-mqtt`):
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Run the publisher script:
   ```bash
   python test_publisher.py
   ```
   The publisher will immediately begin connecting to the local broker at `localhost:1883` and publish simulated telemetry and classification events every few seconds. Watch the web dashboard update live!

---

## ⚙️ Environment Variables Configuration

Both the frontend and backend are configured using environment variables. See the `.env.example` templates in the root folder and the `/backend` folder for reference.

### Root Environment Settings (`.env`)
* `MOCK_MODE`: Set to `true` to run the backend in-memory without needing MongoDB or MQTT. Set to `false` (default in docker) to connect to real services.
* `MONGO_URI`: MongoDB connection connection string (defaults to `mongodb://mongodb:27017` in docker).
* `MQTT_BROKER`: Hostname of the MQTT broker (defaults to `mosquitto` in docker).
* `MQTT_PORT`: Port of the MQTT broker (defaults to `1883`).
* `ALLOWED_ORIGINS`: Comma-separated CORS allowed domains (default is `*`).
* `TWILIO_WEBHOOK_URL`: Webhook URL triggered when threshold alert triggers.

---

## 🗂️ Project Structure

```text
├── backend/
│   ├── app/
│   │   ├── routers/       # API routers (bins, alerts, websockets)
│   │   ├── services/      # MQTT, WebSocket, and alert handling services
│   │   ├── config.py      # App configurations loading
│   │   ├── db.py          # MongoDB setup and index creation
│   │   ├── main.py        # FastAPI app & lifespan configuration
│   │   └── models.py      # Pydantic schemas
│   ├── Dockerfile         # Python slim production image
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # React visual and analytics components
│   │   ├── hooks/         # Custom React hooks (WebSockets)
│   │   └── main.jsx
│   ├── Dockerfile         # Multi-stage production Docker build
│   ├── nginx.conf         # Production Nginx reverse-proxy configuration
│   ├── vercel.json        # Rewrites for Vercel deployment
│   └── package.json
├── mosquitto/
│   └── mosquitto.conf     # Broker configuration file
├── docker-compose.yml     # Multi-container service orchestrator
└── test_publisher.py      # Standalone simulated publisher script
```
