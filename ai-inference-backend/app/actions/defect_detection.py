#D:\4THYEAR\CAPSTONE\MEGG\ai-inference-backend\app\actions\defect_detection.py

import logging
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

IOT_BACKEND_MOVE_ENDPOINT = os.getenv("IOT_BACKEND_MOVE_ENDPOINT", "http://localhost:9000/api/move-egg")


async def handle_defect_detection(message):
  """
  Simplified defect detection handler - now only handles motor movement
  AI detection is handled directly by the frontend via Roboflow API
  """
  try:
    logger.info("🔍 Processing defect detection request")
    
    # Trigger motor movement
    await move_motor()

    return {
      "action": "defect_detection_result",
      "status": "motor_triggered",
      "message": "Motor movement completed"
    }
  except Exception as e:
    logger.error(f"❌ Error during defect detection: {e}")
    return {
      "action": "defect_detection_result",
      "error": str(e)
    }
  

async def move_motor():
  try:
    async with httpx.AsyncClient() as client:
      response = await client.post(IOT_BACKEND_MOVE_ENDPOINT)
      response.raise_for_status()
      logger.info(f"Motor moved successfully: {response.json()}")
  except httpx.HTTPError as e:
    logger.error(f"Failed to trigger motor: {e}")


