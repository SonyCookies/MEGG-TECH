# MEGG IoT Backend Setup Guide

## 🚀 Complete IoT Backend System for MEGG Egg Processing

This guide will help you set up the complete IoT backend system that enables communication between your kiosk frontend and Arduino hardware for calibration.

## 📋 What's Been Created

### 1. **IoT Backend Server** (`E:\MEGG-FINAL\iot-backend\`)
- **FastAPI REST API** for HTTP communication
- **WebSocket Server** for real-time communication
- **Arduino Serial Communication** service
- **Hardware Calibration** endpoints
- **Complete documentation** and startup scripts

### 2. **Updated Arduino Code** (`C:\Users\sonny\Documents\PlatformIO\Projects\megg-arduino-control\`)
- **Complete hardware support** for all components
- **Calibration commands** for UNO, HX711, NEMA23, SG90, MG996R
- **Serial communication** with IoT backend
- **Status reporting** and error handling

### 3. **Enhanced Kiosk Frontend** (`E:\MEGG-FINAL\kiosk-next-frontend\`)
- **IoT Service** for backend communication
- **Real-time calibration** with Arduino
- **Connection status** indicators
- **WebSocket integration** for live updates

## 🔧 Setup Instructions

### Step 1: Arduino Setup

1. **Upload Updated Code**:
   ```bash
   # Navigate to Arduino project
   cd C:\Users\sonny\Documents\PlatformIO\Projects\megg-arduino-control
   
   # Upload to Arduino (using PlatformIO)
   pio run --target upload
   ```

2. **Verify Arduino Connection**:
   - Open Serial Monitor (9600 baud)
   - You should see: "MEGG Hardware Control System Starting..."
   - Test with command: `STATUS`

### Step 2: IoT Backend Setup

1. **Navigate to Backend Directory**:
   ```bash
   cd E:\MEGG-FINAL\iot-backend
   ```

2. **Install Dependencies** (if not already done):
   ```bash
   python -m pip install -r requirements.txt
   ```

3. **Configure Arduino Port**:
   - Edit `config.env` and set your Arduino's COM port
   - Default: `ARDUINO_PORT=COM3`
   - Find your port in Device Manager (Windows) or `ls /dev/tty*` (Linux)

4. **Start IoT Backend**:
   ```bash
   # Option 1: Using startup script
   start.bat
   
   # Option 2: Direct Python execution
   python main.py
   ```

5. **Verify Backend is Running**:
   - Open browser: `http://localhost:8000`
   - You should see API documentation
   - Check health: `http://localhost:8000/health`

### Step 3: Kiosk Frontend Setup

1. **Navigate to Frontend Directory**:
   ```bash
   cd E:\MEGG-FINAL\kiosk-next-frontend
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Verify Frontend is Running**:
   - Open browser: `http://localhost:3000`
   - Navigate to **Calibration** tab
   - Check connection status indicators

## 🎯 How It Works

### Communication Flow:
```
Kiosk Frontend → IoT Backend → Arduino → Hardware
     ↓              ↓           ↓         ↓
  WebSocket → REST API → Serial → Calibration
```

### Calibration Process:
1. **User clicks calibration button** in kiosk frontend
2. **Frontend sends request** to IoT backend via WebSocket
3. **Backend forwards command** to Arduino via serial
4. **Arduino performs calibration** on hardware component
5. **Arduino sends status** back to backend
6. **Backend broadcasts result** to frontend via WebSocket
7. **Frontend displays result** to user

## 🔌 Hardware Components

| Component | Purpose | Calibration Command |
|-----------|---------|-------------------|
| **UNO** | Main microcontroller | Tests pins and functionality |
| **HX711** | Load cell weight sensor | Tares scale and sets calibration |
| **NEMA23** | Stepper motor | Tests movement and positioning |
| **SG90** | Loading servo motor | Tests servo range and center |
| **MG996R** | Gripping servo motor | Tests servo range and center |

## 📡 API Endpoints

### Calibration Endpoints:
- `POST /api/calibrate` - Calibrate any component
- `POST /api/calibrate/uno` - Arduino UNO calibration
- `POST /api/calibrate/hx711` - Load cell calibration
- `POST /api/calibrate/nema23` - Stepper motor calibration
- `POST /api/calibrate/sg90` - Loading servo calibration
- `POST /api/calibrate/mg996r` - Gripping servo calibration

### System Endpoints:
- `GET /api/arduino/status` - Arduino connection status
- `POST /api/arduino/connect` - Connect to Arduino
- `POST /api/arduino/disconnect` - Disconnect from Arduino
- `GET /health` - System health check

## 🌐 WebSocket Communication

**Connection**: `ws://localhost:8001`

**Message Types**:
- `calibration_request` - Request calibration
- `calibration_result` - Calibration result
- `arduino_data` - Raw Arduino data
- `ping/pong` - Keep-alive

## 🧪 Testing the System

### 1. Test Arduino Connection:
```bash
curl http://localhost:8000/api/arduino/status
```

### 2. Test Calibration:
```bash
curl -X POST http://localhost:8000/api/calibrate/uno
```

### 3. Test WebSocket:
- Open browser console on kiosk frontend
- Navigate to Calibration tab
- Click any calibration button
- Watch console for WebSocket messages

## 🚨 Troubleshooting

### Arduino Not Connecting:
1. **Check COM port**: Verify `ARDUINO_PORT` in `config.env`
2. **Check serial monitor**: Ensure Arduino is receiving commands
3. **Check connections**: Verify USB cable and power
4. **Check code upload**: Ensure latest code is uploaded

### WebSocket Issues:
1. **Check backend**: Ensure IoT backend is running on port 8001
2. **Check firewall**: Allow ports 8000 and 8001
3. **Check browser console**: Look for connection errors

### Calibration Failures:
1. **Check Arduino serial output**: Look for error messages
2. **Check hardware connections**: Verify all wiring
3. **Check power supply**: Ensure components are powered
4. **Check calibration timeout**: Increase if needed

## 📁 File Structure

```
E:\MEGG-FINAL\
├── iot-backend/                 # IoT Backend Server
│   ├── main.py                 # FastAPI application
│   ├── config.py               # Configuration
│   ├── services/               # Business logic
│   │   ├── arduino_service.py  # Arduino communication
│   │   └── websocket_service.py # WebSocket handling
│   ├── controllers/            # API endpoints
│   │   └── calibration_controller.py
│   ├── requirements.txt        # Dependencies
│   ├── config.env             # Environment config
│   └── start.bat              # Startup script
│
├── kiosk-next-frontend/        # Kiosk Frontend
│   ├── app/
│   │   ├── services/
│   │   │   └── iotService.ts   # IoT communication service
│   │   └── components/
│   │       └── CalibrationTab.tsx # Updated calibration interface
│   └── ...
│
└── SETUP_GUIDE.md             # This file
```

## 🎉 You're Ready!

Your MEGG IoT backend system is now complete! Here's what you can do:

1. **Start the IoT backend**: `cd E:\MEGG-FINAL\iot-backend && python main.py`
2. **Start the kiosk frontend**: `cd E:\MEGG-FINAL\kiosk-next-frontend && npm run dev`
3. **Upload Arduino code**: Use PlatformIO to upload the updated code
4. **Test calibration**: Navigate to Calibration tab and click any button

The system will now communicate between your kiosk frontend and Arduino hardware for real-time calibration! 🚀

