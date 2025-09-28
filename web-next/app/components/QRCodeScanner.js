"use client"

import { useState, useEffect, useRef } from "react"
import { Camera, FileImage, Loader2, X, CheckCircle, AlertTriangle } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"

export default function QRCodeScanner({ onQRCodeScanned, onClose, currentUser }) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanMode, setScanMode] = useState(null) // 'camera' or 'upload'
  const [isProcessing, setIsProcessing] = useState(false)
  const [scanError, setScanError] = useState(null)
  const [scanSuccess, setScanSuccess] = useState(false)
  const fileInputRef = useRef(null)

  // Always render both elements
  // Camera: qr-reader, File upload: qr-reader-hidden

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.html5QrCodeInstance) {
        window.html5QrCodeInstance.stop().catch(() => {})
        window.html5QrCodeInstance = null
      }
    }
  }, [])

  const startCameraScan = () => {
    setScanMode('camera')
    setIsScanning(true)
    setScanError(null)
    setScanSuccess(false)
    setTimeout(() => {
      const html5QrCode = new Html5Qrcode("qr-reader")
      window.html5QrCodeInstance = html5QrCode
      html5QrCode
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 350, height: 350 } },
          (decodedText) => {
            handleQRCodeScanned(decodedText)
            html5QrCode.stop()
            setIsScanning(false)
          },
          (error) => {
            // Ignore scanning errors
          }
        )
        .catch(() => {
          setScanError("Error accessing camera. Please try again.")
          setIsScanning(false)
        })
    }, 100)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanMode('upload')
    setIsScanning(true)
    setScanError(null)
    setScanSuccess(false)
    try {
      const html5QrCode = new Html5Qrcode("qr-reader-hidden")
      window.html5QrCodeInstance = html5QrCode
      const decodedText = await html5QrCode.scanFile(file, false)
      html5QrCode.clear()
      handleQRCodeScanned(decodedText)
      setIsScanning(false)
    } catch (error) {
      setScanError("Could not read QR code from image. Please try another image or use the camera scanner.")
      setIsScanning(false)
    }
  }

  const handleQRCodeScanned = async (decodedText) => {
    try {
      setIsProcessing(true)
      setScanError(null)
      // Parse the QR code data
      let machineData
      try {
        machineData = JSON.parse(decodedText)
      } catch (parseError) {
        // If it's not JSON, try to extract machine ID and token from URL or plain text
        const urlMatch = decodedText.match(/machineId=([^&]+)&token=([^&]+)/)
        if (urlMatch) {
          machineData = {
            machineId: urlMatch[1],
            linkToken: urlMatch[2]
          }
        } else {
          throw new Error("Invalid QR code format")
        }
      }
      // Accept both 'machineId' and 'id' as valid
      const machineId = machineData.machineId || machineData.id
      if (!machineId || !machineData.linkToken) {
        throw new Error("QR code missing required machine information")
      }
      // Link the machine using the API
      const response = await fetch('/api/machines/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          machineId: machineId,
          linkToken: machineData.linkToken,
          userId: currentUser.uid,
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to link machine')
      }
      if (result.alreadyLinked) {
        setScanError(result.message)
        return
      }
      setScanSuccess(true)
      if (onQRCodeScanned) {
        onQRCodeScanned(machineData, result)
      }
    } catch (error) {
      setScanError(error.message || "Failed to process QR code")
    } finally {
      setIsProcessing(false)
    }
  }

  const resetScanner = () => {
    if (window.html5QrCodeInstance) {
      window.html5QrCodeInstance.stop().catch(() => {})
      window.html5QrCodeInstance = null
    }
    setIsScanning(false)
    setScanMode(null)
    setScanError(null)
    setScanSuccess(false)
    setIsProcessing(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClose = () => {
    resetScanner()
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg border border-dashed border-gray-300 bg-gray-50">
      {/* Success Message */}
      {scanSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div className="flex flex-col">
            <span className="font-medium text-green-800">Machine linked successfully!</span>
            <span className="text-sm text-green-600">
              The machine has been added to your account.
            </span>
          </div>
        </div>
      )}
      {/* Error Message */}
      {scanError && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <div className="flex flex-col">
            <span className="font-medium text-red-800">Error</span>
            <span className="text-sm text-red-600">{scanError}</span>
          </div>
          <button
            onClick={() => setScanError(null)}
            className="ml-auto p-1 hover:bg-red-100 rounded"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}
      {/* Initial State */}
      {!isScanning && !scanSuccess && (
        <>
          <div className="flex flex-col gap-2 items-center justify-center py-6">
            <div className="bg-gray-200 size-56 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-2 bg-gray-300 rounded-lg flex items-center justify-center">
                  <span className="text-4xl">📱</span>
                </div>
                <span className="text-gray-500 text-sm">QR Code Scanner</span>
              </div>
            </div>
            <span className="text-gray-500 text-center">
              Choose how you want to add a machine
            </span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-2">
            <button 
              onClick={startCameraScan}
              className="flex items-center justify-center text-white hover:bg-blue-600 gap-2 rounded-lg px-4 py-2 bg-blue-500 transition-colors duration-150 cursor-pointer w-full"
            >
              <Camera className="w-5 h-5" />
              Scan QR code
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center hover:bg-gray-300 gap-2 rounded-lg px-4 py-2 bg-gray-200 transition-colors duration-150 cursor-pointer w-full"
            >
              <FileImage className="w-5 h-5" />
              Upload QR code
            </button>
          </div>
        </>
      )}
      {/* Camera Scanner */}
      {isScanning && scanMode === 'camera' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-2">
            <Camera className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Camera Scanner</span>
          </div>
          <div id="qr-reader" style={{ minHeight: 300, width: '100%' }}></div>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm text-gray-500">Point camera at QR code...</span>
          </div>
          <button
            onClick={resetScanner}
            className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-black transition-colors duration-150 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
      {/* File Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      {/* Always render the hidden qr-reader for file upload */}
      <div id="qr-reader-hidden" style={{ display: 'none' }}></div>
      {/* Processing State */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-gray-600">Linking machine...</span>
        </div>
      )}
    </div>
  )
} 