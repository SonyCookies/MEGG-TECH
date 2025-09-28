#!/bin/bash
# setup_pi.sh - Raspberry Pi Setup Script for MEGG IoT Backend

echo "🍓 Setting up MEGG IoT Backend on Raspberry Pi..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install required system packages
echo "🔧 Installing required packages..."
sudo apt install -y python3 python3-pip python3-venv git

# Install pyserial system dependencies
echo "📡 Installing serial communication dependencies..."
sudo apt install -y python3-serial

# Add user to dialout group for serial port access
echo "🔐 Adding user to dialout group..."
sudo usermod -a -G dialout $USER

# Create project directory
PROJECT_DIR="/home/$USER/megg-iot-backend"
if [ ! -d "$PROJECT_DIR" ]; then
    echo "📁 Creating project directory..."
    mkdir -p "$PROJECT_DIR"
fi

# Copy project files (if not already there)
if [ ! -f "$PROJECT_DIR/simple_main.py" ]; then
    echo "📋 Copying project files..."
    cp -r * "$PROJECT_DIR/"
    chown -R $USER:$USER "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x start_pi.sh setup_pi.sh

# Create virtual environment
echo "🐍 Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📥 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Set up systemd service (optional)
echo "⚙️ Setting up systemd service..."
sudo cp megg-iot-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable megg-iot-backend.service

echo ""
echo "✅ Setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Reboot your Raspberry Pi to apply group changes:"
echo "   sudo reboot"
echo ""
echo "2. After reboot, start the service:"
echo "   sudo systemctl start megg-iot-backend"
echo ""
echo "3. Or run manually:"
echo "   cd $PROJECT_DIR"
echo "   ./start_pi.sh"
echo ""
echo "4. Check service status:"
echo "   sudo systemctl status megg-iot-backend"
echo ""
echo "5. View logs:"
echo "   sudo journalctl -u megg-iot-backend -f"
echo ""
echo "🔌 Connect your Arduino to a USB port and the service will auto-detect it!"
