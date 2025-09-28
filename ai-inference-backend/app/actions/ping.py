import logging
from app.core.model_loader import get_model_status, is_model_ready

logger = logging.getLogger(__name__)

async def handle_ping(message):
    """Enhanced ping with health status"""
    try:
        model_status = get_model_status()
        
        # Only log ping failures to reduce noise
        if not is_model_ready():
            logger.debug(f"Ping received but model not ready: {model_status.get('error')}")
        
        return {
            "action": "pong",
            "status": "healthy" if is_model_ready() else "unhealthy",
            "model_ready": is_model_ready(),
            "timestamp": message.get("timestamp")
        }
    except Exception as e:
        logger.error(f"Error handling ping: {e}")
        return {
            "action": "pong", 
            "status": "error",
            "error": str(e)
        }