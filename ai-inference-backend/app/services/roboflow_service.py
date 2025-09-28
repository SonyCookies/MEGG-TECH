"""
Roboflow Serverless API Service
Handles egg defect detection using Roboflow's hosted API
"""

import logging
import base64
import io
import requests
from typing import Tuple, Optional
from PIL import Image

# Configure logging
logger = logging.getLogger(__name__)

class RoboflowService:
    """Service for interacting with Roboflow's serverless API"""
    
    def __init__(self):
        """Initialize Roboflow client"""
        self.api_url = "https://serverless.roboflow.com"
        self.api_key = "xYnojLQ4tPCn60yZmq3l"  # Your API key
        self.workspace_name = "meggtech"
        self.workflow_id = "custom-workflow"
        
        logger.info("✅ Roboflow service initialized successfully")
    
    def predict_defect(self, image_data: str) -> Tuple[str, float]:
        """
        Predict egg defect using Roboflow API
        
        Args:
            image_data: Base64 encoded image data (data URL format)
            
        Returns:
            Tuple of (predicted_class, confidence)
        """
        try:
            # Extract base64 data from data URL
            if image_data.startswith('data:image'):
                header, base64_data = image_data.split(',', 1)
                image_bytes = base64.b64decode(base64_data)
            else:
                # Assume it's already base64 encoded
                image_bytes = base64.b64decode(image_data)
            
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Ensure image is in RGB format
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize to 224x224 (Roboflow will handle this, but good to be consistent)
            image = image.resize((224, 224), Image.Resampling.LANCZOS)
            
            logger.info("🔍 Sending image to Roboflow API for prediction...")
            
            # Prepare the request
            url = f"{self.api_url}/workflow/{self.workspace_name}/{self.workflow_id}"
            
            # Convert image back to bytes for upload
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='JPEG')
            img_bytes = img_buffer.getvalue()
            
            # Make the API request
            files = {
                'image': ('image.jpg', img_bytes, 'image/jpeg')
            }
            
            headers = {
                'Authorization': f'Bearer {self.api_key}'
            }
            
            response = requests.post(url, files=files, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"✅ Roboflow API response received: {result}")
            
            # Extract prediction from result
            if 'predictions' in result and len(result['predictions']) > 0:
                prediction = result['predictions'][0]
                predicted_class = prediction.get('class', 'unknown')
                confidence = float(prediction.get('confidence', 0.0))
                
                logger.info(f"🎯 Prediction: {predicted_class} (confidence: {confidence:.2f})")
                return predicted_class, confidence
            else:
                logger.warning("⚠️ No predictions found in Roboflow response")
                return "unknown", 0.0
                
        except Exception as e:
            logger.error(f"❌ Error calling Roboflow API: {e}")
            return "error", 0.0
    
    def get_status(self) -> dict:
        """
        Get service status
        
        Returns:
            Dictionary with service status information
        """
        try:
            # Test API connection with a simple GET request
            url = f"{self.api_url}/workflow/{self.workspace_name}/{self.workflow_id}"
            headers = {
                'Authorization': f'Bearer {self.api_key}'
            }
            
            # Simple connectivity test - just check if the endpoint is reachable
            response = requests.get(url, headers=headers, timeout=10)
            
            # Even if we get a 404 or 405, it means the service is reachable
            if response.status_code in [200, 404, 405]:
                return {
                    "status": "healthy",
                    "service": "roboflow-api",
                    "workspace": self.workspace_name,
                    "workflow": self.workflow_id,
                    "connected": True,
                    "error": None
                }
            else:
                raise Exception(f"API returned status {response.status_code}")
            
        except Exception as e:
            logger.error(f"❌ Roboflow API health check failed: {e}")
            return {
                "status": "unhealthy",
                "service": "roboflow-api",
                "workspace": self.workspace_name,
                "workflow": self.workflow_id,
                "connected": False,
                "error": str(e)
            }

# Global instance
roboflow_service = RoboflowService()
