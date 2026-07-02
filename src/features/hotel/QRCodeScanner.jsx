import { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Button } from "@/shared/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/card";
import { Badge } from "@/shared/components/badge";
import { 
  Camera, 
  CameraOff, 
  QrCode, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Smartphone,
  Upload,
  Image as ImageIcon,
  FileImage,
  X
} from "lucide-react";
import { toast } from "sonner";

// Custom CSS for scanning animation
const scannerStyles = `
  @keyframes scanBeam {
    0% {
      transform: translateY(-100%);
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      transform: translateY(100%);
      opacity: 0;
    }
  }
  
  .scanning-beam {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, #10b981, transparent);
    animation: scanBeam 2s infinite;
    box-shadow: 0 0 10px #10b981;
  }
  
  @keyframes borderGlow {
    0%, 100% {
      box-shadow: 0 0 5px #10b981;
    }
    50% {
      box-shadow: 0 0 20px #10b981, 0 0 30px #10b981;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = scannerStyles;
  if (!document.head.querySelector('style[data-scanner-styles]')) {
    styleElement.setAttribute('data-scanner-styles', 'true');
    document.head.appendChild(styleElement);
  }
}

// Hook to detect mobile device
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // Check user agent for mobile devices
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileUA = mobileRegex.test(navigator.userAgent);
      
      // Check for touch support
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Check screen size (mobile-like width)
      const isMobileWidth = window.innerWidth <= 768;
      
      // Consider it mobile if it matches user agent OR (has touch AND mobile width)
      setIsMobile(isMobileUA || (hasTouch && isMobileWidth));
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

const QRCodeScanner = ({ onScanSuccess, isActive }) => {
  const isMobile = useIsMobile();
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState(null);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [scanMode, setScanMode] = useState(isMobile ? 'camera' : 'upload'); // Default to camera on mobile, upload on desktop
  const [uploadedImage, setUploadedImage] = useState(null);
  const [processingUpload, setProcessingUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Initialize the code reader
    readerRef.current = new BrowserMultiFormatReader();
    
    // Initialize camera only on mobile
    if (isMobile) {
      initializeCamera();
    }
    
    return () => {
      // Cleanup function
      try {
        stopScanning();
      } catch (err) {
        
      }
    };
  }, [isMobile]);

  useEffect(() => {
    if (!isActive && isScanning) {
      // Stop scanning when component becomes inactive
      stopScanning();
    }
  }, [isActive, isScanning]);

  const initializeCamera = async () => {
    try {
      setError(null);
      setHasPermission(null);
      
      // Get available video devices
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      setDevices(videoInputDevices);
      
      if (videoInputDevices.length === 0) {
        setError('No camera devices found. Please ensure your device has a camera.');
        setHasPermission(false);
        return;
      }
      
      // Prefer back camera for mobile devices - try multiple variations
      const backCamera = videoInputDevices.find(device => {
        const label = device.label.toLowerCase();
        return label.includes('back') || 
               label.includes('rear') || 
               label.includes('environment') ||
               label.includes('facing back') ||
               label.includes('camera 0') ||
               device.deviceId.includes('back');
      });
      
      const selectedDevice = backCamera || videoInputDevices[0];
      setSelectedDevice(selectedDevice);
      setHasPermission(true);
      
    } catch (err) {
      
      setError(`Unable to access camera: ${err.message}`);
      setHasPermission(false);
    }
  };

  const startScanning = async () => {
    if (!readerRef.current) {
      
      setError('QR scanner not initialized. Please refresh the page.');
      return;
    }
    
    if (!selectedDevice) {
      
      await initializeCamera();
      if (!selectedDevice) {
        setError('No camera device available. Please check your device has a camera.');
        return;
      }
    }

    if (!videoRef.current) {
      
      setError('Camera interface not ready. Please try again.');
      return;
    }

    try {
      setError(null);
      setIsScanning(true);
      
      // Start continuous scanning with the visible video element
      await readerRef.current.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        (scanResult, error) => {
          if (scanResult) {
            handleScanResult(scanResult.getText());
          }
          // Ignore NotFoundException as it's normal when no QR code is visible
          if (error && error.name !== 'NotFoundException') {
            
          }
        }
      );
      
      setHasPermission(true);
      toast.success("Camera Active", {
        description: "Point camera at QR code within the frame",
        duration: 6000
      });
      
    } catch (err) {

      setIsScanning(false);
      setHasPermission(false);
      
      let errorMessage = 'Failed to start camera';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please ensure your device has a camera.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not supported.';
      } else if (err.message) {
        errorMessage = `Camera error: ${err.message}`;
      }
      
      setError(errorMessage);
      toast.error("Camera Error", {
        description: errorMessage,
        duration: 6000
      });
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      try {
        // Stop the video stream from the main video element
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject;
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
        
        // Reset the reader if the method exists
        if (typeof readerRef.current.reset === 'function') {
          readerRef.current.reset();
        } else if (typeof readerRef.current.stopContinuousDecode === 'function') {
          readerRef.current.stopContinuousDecode();
        }
      } catch (err) {
        
      }
    }
    setIsScanning(false);
  };

  const handleScanResult = (result) => {
    try {
      setLastScanResult(result);
      
      // Stop scanning after successful detection to prevent multiple scans
      stopScanning();
      
      // Try to parse as JSON (booking QR code)
      const bookingData = JSON.parse(result);
      
      if (bookingData.bookingId || bookingData.id) {
        toast.success("QR Code Scanned Successfully!", {
          description: "Booking information found and processed",
          duration: 6000
        });
        onScanSuccess(bookingData);
      } else {
        throw new Error('Invalid booking QR code format');
      }
      
    } catch (err) {
      
      toast.error("Invalid QR Code", {
        description: "This doesn't appear to be a valid booking QR code",
        duration: 6000
      });
      
      // Stop scanning on error as well
      stopScanning();
      
      // Still pass the raw result in case it's useful
      onScanSuccess({ rawData: result, error: 'Invalid format' });
    }
  };

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Invalid File Type", {
        description: "Please upload an image file (PNG, JPG, etc.)",
        duration: 6000
      });
      return;
    }

    // Validate file size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast.error("File Too Large", {
        description: "Please upload an image smaller than 4MB",
        duration: 6000
      });
      return;
    }

    try {
      setProcessingUpload(true);
      setError(null);

      // Create image URL for preview
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);

      // Create image element for QR code reading
      const img = new Image();
      img.onload = async () => {
        try {
          // Decode QR code from image
          const result = await readerRef.current.decodeFromImageUrl(imageUrl);
          handleScanResult(result.getText());
        } catch (err) {
          
          toast.error("No QR Code Found", {
            description: "Could not find a valid QR code in this image",
            duration: 6000
          });
        } finally {
          setProcessingUpload(false);
        }
      };
      
      img.onerror = () => {
        setProcessingUpload(false);
        toast.error("Invalid Image", {
          description: "Could not load the uploaded image",
          duration: 6000
        });
      };
      
      img.src = imageUrl;

    } catch (err) {
      
      setProcessingUpload(false);
      toast.error("Upload Failed", {
        description: "There was an error processing your image",
        duration: 6000
      });
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Clear uploaded image
  const clearUploadedImage = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage);
      setUploadedImage(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Switch scan mode
  const switchScanMode = (mode) => {
    if (mode === 'camera' && isScanning) {
      stopScanning();
    }
    if (mode === 'upload') {
      clearUploadedImage();
    }
    setScanMode(mode);
    setError(null);
  };

  const switchCamera = () => {
    if (devices.length > 1 && selectedDevice) {
      const currentIndex = devices.findIndex(d => d.deviceId === selectedDevice.deviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      setSelectedDevice(devices[nextIndex]);
      
      if (isScanning) {
        stopScanning();
        setTimeout(() => {
          startScanning();
        }, 500);
      }
      
      toast.success("Camera Switched", {
        description: `Using ${devices[nextIndex].label}`,
        duration: 6000
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {(isScanning || processingUpload) && (
            <Badge variant="secondary" className="ml-auto">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
              {isScanning ? 'Scanning' : 'Processing'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Scan Mode Toggle - Only show camera option on mobile */}
        {isMobile ? (
          <div className="flex rounded-lg bg-gray-100 p-1">
            <Button
              variant={scanMode === 'camera' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 h-8"
              onClick={() => switchScanMode('camera')}
            >
              <Camera className="mr-2 h-4 w-4" />
              Camera
            </Button>
            <Button
              variant={scanMode === 'upload' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 h-8"
              onClick={() => switchScanMode('upload')}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-700">
              <Upload className="h-5 w-5" />
              <span className="text-sm font-medium">Upload QR Code Image</span>
            </div>
          </div>
        )}

        {/* Camera Mode - Only on mobile devices */}
        {scanMode === 'camera' && isMobile && (
          <div className="relative bg-[#050203] rounded-lg overflow-hidden aspect-square">
            {/* Video element for camera feed */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${isScanning ? 'block' : 'hidden'}`}
              autoPlay
              playsInline
              muted
            />
            
            {isScanning && (
              <>
                {/* Camera viewfinder overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Dark overlay with cutout for scanning area */}
                  <div className="absolute inset-0 bg-[#050203] bg-opacity-60">
                    {/* Cutout area - larger scanning zone */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64">
                      <div className="w-full h-full border-2 border-transparent relative">
                        {/* Corner brackets - Top Left */}
                        <div className="absolute -top-2 -left-2 w-12 h-12">
                          <div className="absolute top-0 left-0 w-8 h-1.5 bg-blue-400 rounded"></div>
                          <div className="absolute top-0 left-0 w-1.5 h-8 bg-blue-400 rounded"></div>
                        </div>
                        {/* Corner brackets - Top Right */}
                        <div className="absolute -top-2 -right-2 w-12 h-12">
                          <div className="absolute top-0 right-0 w-8 h-1.5 bg-blue-400 rounded"></div>
                          <div className="absolute top-0 right-0 w-1.5 h-8 bg-blue-400 rounded"></div>
                        </div>
                        {/* Corner brackets - Bottom Left */}
                        <div className="absolute -bottom-2 -left-2 w-12 h-12">
                          <div className="absolute bottom-0 left-0 w-8 h-1.5 bg-blue-400 rounded"></div>
                          <div className="absolute bottom-0 left-0 w-1.5 h-8 bg-blue-400 rounded"></div>
                        </div>
                        {/* Corner brackets - Bottom Right */}
                        <div className="absolute -bottom-2 -right-2 w-12 h-12">
                          <div className="absolute bottom-0 right-0 w-8 h-1.5 bg-blue-400 rounded"></div>
                          <div className="absolute bottom-0 right-0 w-1.5 h-8 bg-blue-400 rounded"></div>
                        </div>
                        
                        {/* Scanning line animation */}
                        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                          <div className="w-full h-0.5 bg-red-400 animate-pulse absolute top-1/2 left-0 transform -translate-y-1/2 shadow-lg"></div>
                        </div>
                        
                        {/* Center dot indicator */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Status overlay at bottom */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-[#050203] bg-opacity-70 text-white text-center py-2 px-4 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Scanning Active</span>
                    </div>
                    <p className="text-xs opacity-80">
                      Position QR code within the frame
                    </p>
                  </div>
                </div>
              </>
            )}
            
            {!isScanning && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                {hasPermission === false ? (
                  <>
                    <AlertTriangle className="h-12 w-12 mb-2 text-red-500" />
                    <p className="text-sm text-center text-red-600 mb-3">
                      Camera permission required
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={initializeCamera}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry Access
                    </Button>
                  </>
                ) : hasPermission === null ? (
                  <>
                    <Camera className="h-12 w-12 mb-2 animate-pulse" />
                    <p className="text-sm text-center">
                      Initializing camera...
                    </p>
                  </>
                ) : (
                  <>
                    <Camera className="h-12 w-12 mb-2" />
                    <p className="text-sm text-center mb-3">
                      {error ? "Camera unavailable" : "Camera ready to scan"}
                    </p>
                    {error && (
                      <div className="text-center space-y-2">
                        <p className="text-xs text-red-600 mb-2">{error}</p>
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setError(null);
                              setHasPermission(null);
                              initializeCamera();
                            }}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.reload()}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh Page
                          </Button>
                        </div>
                      </div>
                    )}
                    {!error && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={startScanning}
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Start Camera
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Upload Mode - Always on desktop, optional on mobile */}
        {(scanMode === 'upload' || !isMobile) && (
          <div className="space-y-4">
            {/* Upload Area */}
            <div
              className={`relative bg-gray-100 rounded-lg border-2 border-dashed transition-colors aspect-square flex flex-col items-center justify-center ${
                dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {uploadedImage ? (
                <div className="relative w-full h-full">
                  <img
                    src={uploadedImage}
                    alt="Uploaded QR Code"
                    className="w-full h-full object-contain rounded-lg"
                  />
                  {processingUpload && (
                    <div className="absolute inset-0 bg-[#050203] bg-opacity-50 flex items-center justify-center rounded-lg">
                      <div className="text-white text-center">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Processing...</p>
                      </div>
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={clearUploadedImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center p-6">
                  <div className="mb-4">
                    {dragOver ? (
                      <FileImage className="h-12 w-12 mx-auto text-blue-500" />
                    ) : (
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {dragOver ? 'Drop image here' : 'Drag & drop QR code image'}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    or click to browse
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Last Scan Result */}
        {lastScanResult && (
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-700">
              <div className="font-medium">Last scan successful</div>
              <div className="text-xs text-green-600 mt-1 break-all">
                {lastScanResult.length > 50 
                  ? `${lastScanResult.substring(0, 50)}...` 
                  : lastScanResult
                }
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons - Only on mobile */}
        {scanMode === 'camera' && isMobile && (
          <div className="flex gap-2">
            <Button
              onClick={isScanning ? stopScanning : startScanning}
              variant={isScanning ? "destructive" : "default"}
              className="flex-1"
            >
              {isScanning ? (
                <>
                  <CameraOff className="mr-2 h-4 w-4" />
                  Stop
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Start Scan
                </>
              )}
            </Button>
            
            {devices.length > 1 && (
              <Button
                onClick={switchCamera}
                variant="outline"
                disabled={!isScanning}
                title="Switch Camera"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            {scanMode === 'camera' ? (
              <Smartphone className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            ) : (
              <ImageIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">
                {scanMode === 'camera' ? 'How to scan:' : 'How to upload:'}
              </div>
              <ul className="space-y-1 text-xs">
                {scanMode === 'camera' ? (
                  <>
                    <li>• Point camera at guest's booking QR code</li>
                    <li>• Ensure good lighting and steady hands</li>
                    <li>• QR code should fill the scanning area</li>
                    <li>• Booking details will appear automatically</li>
                  </>
                ) : (
                  <>
                    <li>• Upload screenshots or photos of QR codes</li>
                    <li>• Drag & drop or click to browse files</li>
                    <li>• Supports PNG, JPG, and other image formats</li>
                    <li>• QR code will be processed automatically</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Device Selection - Only on mobile */}
        {scanMode === 'camera' && isMobile && devices.length > 1 && (
          <div className="text-xs text-gray-600">
            Camera: {selectedDevice?.label || 'Default'}
          </div>
        )}
      </CardContent>
    </Card>
  );  
};

export default QRCodeScanner;

