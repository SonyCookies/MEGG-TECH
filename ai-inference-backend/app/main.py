# D:\4THYEAR\CAPSTONE\MEGG\ai-inference-backend\app\main.py

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.websocket.websocket_server import websocket_endpoint
from app.core.model_loader import load_model, get_model_status, is_model_ready
from app.services.roboflow_service import roboflow_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MEGG AI Inference Backend", version="1.0.0")

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Starting AI Inference Backend with Roboflow API...")
    
    # Test Roboflow connection
    roboflow_status = roboflow_service.get_status()
    if roboflow_status["connected"]:
        logger.info("✅ Roboflow API connection established")
        logger.info("✅ AI Backend startup completed successfully")
    else:
        logger.warning(f"⚠️ AI Backend started with Roboflow connection issues: {roboflow_status.get('error')}")
        # Fallback to local model
        logger.info("🔄 Falling back to local model...")
        load_model()
        model_status = get_model_status()
        if model_status["ready"]:
            logger.info("✅ Local model fallback successful")
        else:
            logger.error(f"❌ Both Roboflow and local model failed: {model_status.get('error')}")

@app.get("/")
async def root():
    return {"message": "MEGG AI Inference Backend is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    # Check Roboflow service first
    roboflow_status = roboflow_service.get_status()
    
    if roboflow_status["connected"]:
        # Roboflow API is working
        health_status = "healthy"
        service_info = {
            "service": "roboflow-api",
            "workspace": roboflow_status["workspace"],
            "workflow": roboflow_status["workflow"],
            "connected": True,
            "error": None
        }
    else:
        # Fallback to local model check
        model_status = get_model_status()
        is_healthy = model_status["ready"] and model_status["loaded"]
        health_status = "healthy" if is_healthy else "unhealthy"
        
        service_info = {
            "service": "local-model",
            "loaded": model_status["loaded"],
            "model_path": model_status.get("model_path"),
            "error": str(model_status.get("error"))[:200] + "..." if model_status.get("error") and len(str(model_status.get("error"))) > 200 else model_status.get("error"),
            "ready": model_status["ready"]
        }
        
        # Only log health check failures to reduce noise
        if not is_healthy:
            logger.warning(f"Health check failed: {model_status.get('error')}")
    
    return {
        "status": health_status,
        "service": "ai-inference-backend",
        "backend": service_info,
        "roboflow": roboflow_status
    }

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.add_api_websocket_route("/ws", websocket_endpoint)

if __name__ == "__main__":
  import uvicorn
  uvicorn.run("app.main:app", host="0.0.0.0", port=8000)


  