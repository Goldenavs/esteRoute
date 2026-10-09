import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Camera, MapPin, UploadCloud, CheckCircle2, ChevronRight, X, AlertCircle, RefreshCw, Zap, ZapOff, Maximize2, Minimize2, Layers, Plus, Minus, Copy, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component to dynamically re-center map if geolocation successfully fetches
function MapFlyTo({ position, defaultPosition }: { position: L.LatLng; defaultPosition: L.LatLng }) {
  const map = useMap();
  useEffect(() => {
    if (position.lat !== defaultPosition.lat || position.lng !== defaultPosition.lng) {
      map.flyTo(position, 17, { animate: true, duration: 1.5 });
    }
  }, [map, position, defaultPosition]);
  return null;
}

// Component to render custom stylized controls inside the map
function CustomMapControls({ setMapStyle }: { setMapStyle: React.Dispatch<React.SetStateAction<'light' | 'dark'>> }) {
  const map = useMap();
  
  return (
    <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
      <button 
        type="button" 
        onClick={() => map.zoomIn()}
        className="p-2.5 bg-surface/90 backdrop-blur-md border border-border-subtle rounded-sm text-text-primary hover:bg-brand-primary hover:text-white transition-colors shadow-lg -skew-x-6"
        title="Zoom In"
      >
        <Plus className="w-4 h-4 skew-x-6" />
      </button>
      <button 
        type="button" 
        onClick={() => map.zoomOut()}
        className="p-2.5 bg-surface/90 backdrop-blur-md border border-border-subtle rounded-sm text-text-primary hover:bg-brand-primary hover:text-white transition-colors shadow-lg -skew-x-6"
        title="Zoom Out"
      >
        <Minus className="w-4 h-4 skew-x-6" />
      </button>
      
      <div className="w-full h-px bg-border-strong my-1"></div>

      <button 
        type="button" 
        onClick={() => setMapStyle(prev => prev === 'light' ? 'dark' : 'light')}
        className="p-2.5 bg-surface/90 backdrop-blur-md border border-border-subtle rounded-sm text-text-primary hover:bg-brand-secondary hover:text-black transition-colors shadow-lg -skew-x-6"
        title="Toggle Map Style"
      >
        <Layers className="w-4 h-4 skew-x-6" />
      </button>
    </div>
  );
}

export default function BlockageSubmissionForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingRef, setTrackingRef] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameraCount, setCameraCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCameraExpanded, setIsCameraExpanded] = useState(false);
  const [mapStyle, setMapStyle] = useState<'light' | 'dark'>('dark');
  const [hasCopied, setHasCopied] = useState(false);
  
  // Geolocation State (Defaults to Cebu City Center)
  const defaultPosition = useMemo(() => new L.LatLng(10.3157, 123.8854), []);
  const [position, setPosition] = useState<L.LatLng>(defaultPosition);
  const markerRef = useRef<L.Marker>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Detect camera count on mount
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setCameraCount(cameras.length);
      })
      .catch(err => console.error("Could not enumerate devices", err));
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
    setIsCameraExpanded(false);
  };

  // Cleanup object URL and camera stream on unmount
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      stopCamera();
    };
  }, [photoPreview]);

  // Attach the stream to the video element once it mounts in the DOM
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => console.error("Error playing video:", err));
    }
  }, [isCameraActive, isCameraExpanded]);

  // Task 3.2: Auto-capture Geolocation on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition(new L.LatLng(pos.coords.latitude, pos.coords.longitude));
        },
        (err) => {
          console.warn("Geolocation access denied or failed. Defaulting to center.", err);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  // Draggable marker event handler
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          setPosition(marker.getLatLng());
        }
      },
    }),
    []
  );



  const handleLocateMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition(new L.LatLng(pos.coords.latitude, pos.coords.longitude));
        },
        () => {
          alert("Could not access your location. Please check your browser permissions.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  };

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCamera();
    try {
      // First try to get the exact camera (front or back)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { exact: mode } } 
      });
      streamRef.current = stream;
      setFacingMode(mode);
      setIsCameraActive(true);
    } catch {
      // If exact fails (e.g. laptop webcam has no 'environment'), fallback to ideal
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: mode } } 
        });
        streamRef.current = stream;
        setFacingMode(mode);
        setIsCameraActive(true);
      } catch (fallbackErr) {
        console.error("Error accessing camera:", fallbackErr);
        showToast("Could not access camera. Please check permissions.");
      }
    }
  };

  const toggleCamera = () => {
    startCamera(facingMode === 'environment' ? 'user' : 'environment');
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    
    // Check if device supports torch
    const capabilities = track.getCapabilities() as unknown as { torch?: boolean };
    
    if (capabilities.torch) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !isTorchOn }]
        } as unknown as MediaTrackConstraints);
        setIsTorchOn(!isTorchOn);
      } catch (err) {
        console.error("Error toggling torch:", err);
        showToast("Failed to toggle flashlight.");
      }
    } else {
      showToast("Flashlight is not supported on this device.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match the video feed
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert("Invalid file format. Please select a JPEG, PNG, or WebP image.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        alert("File size exceeds 8MB limit. Please choose a smaller photo.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("photo", photoFile);
      formData.append("latitude", position.lat.toString());
      formData.append("longitude", position.lng.toString());
      if (notes.trim()) {
        formData.append("notes", notes.trim());
      }

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/api/reports/`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to submit report.");
      }

      const data = await response.json();
      setTrackingRef(data.tracking_reference);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Submission error:", error);
      alert("There was an error submitting your report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setHasCopied(false);
    removePhoto();
    setNotes('');
  };

  const handleCopy = () => {
    if (trackingRef) {
      navigator.clipboard.writeText(trackingRef);
      setHasCopied(true);
      showToast("Tracking number copied to clipboard!");
    }
  };

  const renderCameraControls = () => (
    <>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className={twMerge("w-full h-full object-cover", facingMode === 'user' && "scale-x-[-1]")} 
      />
      
      <div className="absolute top-4 left-4 z-10">
        <button 
          type="button" 
          onClick={() => setIsCameraExpanded(!isCameraExpanded)}
          className="p-2.5 bg-black/60 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors duration-300 shadow-lg"
          title={isCameraExpanded ? "Minimize" : "Maximize"}
        >
          {isCameraExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Camera Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 z-10">
        <button 
          type="button" 
          onClick={stopCamera}
          className="p-2.5 bg-black/60 hover:bg-semantic-urgent backdrop-blur-md rounded-full text-white transition-colors duration-300 shadow-lg"
          title="Close Camera"
        >
          <X className="w-5 h-5" />
        </button>
        
        {cameraCount > 1 && (
          <button 
            type="button" 
            onClick={toggleCamera}
            className="p-2.5 bg-black/60 hover:bg-brand-primary backdrop-blur-md rounded-full text-white transition-colors duration-300 shadow-lg"
            title="Flip Camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}

        <button 
          type="button" 
          onClick={toggleTorch}
          className={twMerge(
            "p-2.5 backdrop-blur-md rounded-full text-white transition-colors duration-300 shadow-lg",
            isTorchOn ? "bg-brand-secondary text-black" : "bg-black/60 hover:bg-brand-secondary/50"
          )}
          title="Toggle Flashlight"
        >
          {isTorchOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
        </button>
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10">
        <div className="p-1.5 border-4 border-white/50 rounded-full">
          <button
            type="button"
            onClick={capturePhoto}
            className={twMerge(
              "bg-white rounded-full hover:bg-gray-300 active:scale-95 transition-all duration-300 shadow-2xl",
              isCameraExpanded ? "w-20 h-20" : "w-16 h-16"
            )}
            aria-label="Take Photo"
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="w-full relative pb-10 min-h-[calc(100vh-6rem)]">
      
      {/* Submission Success Modal */}
      {isSubmitted && createPortal(
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-app-bg/80 backdrop-blur-md animate-in fade-in duration-500" />
          
          <div className="relative w-full max-w-lg bg-surface/90 backdrop-blur-2xl border border-brand-primary/30 rounded-sm shadow-[0_0_80px_-15px_rgba(var(--brand-primary),0.3)] overflow-hidden -skew-x-2 animate-in zoom-in-95 duration-500">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-secondary via-brand-primary to-brand-secondary"></div>
            
            <div className="skew-x-2 p-8 md:p-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-heading font-black tracking-tight text-text-primary mb-2">Report Submitted</h2>
              <p className="text-text-muted mb-8 text-sm md:text-base">Thank you for keeping our community safe. Guest submissions cannot be tracked later unless you save this reference number.</p>
              
              <div className="w-full mb-8 flex flex-col gap-3">
                <div className="bg-app-bg w-full p-4 rounded-sm border border-border-subtle flex items-center justify-between gap-4 -skew-x-6 relative shadow-inner">
                  <div className="skew-x-6 flex flex-col items-start gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Tracking Reference</span>
                    <span className="text-xl md:text-2xl font-mono font-black text-brand-primary">{trackingRef || "ER-2026-000000"}</span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className={twMerge(
                      "skew-x-6 p-3 rounded-sm transition-all duration-300 flex-shrink-0 border",
                      hasCopied 
                        ? "bg-green-500/20 text-green-500 border-green-500/30" 
                        : "bg-surface text-text-primary hover:bg-brand-primary hover:text-white border-border-subtle"
                    )}
                    title="Copy Tracking Number"
                  >
                    {hasCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                
                {!hasCopied && (
                  <div className="flex items-center justify-center gap-2 text-semantic-warning text-xs font-bold uppercase tracking-widest animate-pulse">
                    <AlertCircle className="w-4 h-4" />
                    <span>Please copy your reference number</span>
                  </div>
                )}
              </div>

              <button 
                onClick={resetForm}
                disabled={!hasCopied}
                className={twMerge(
                  "w-full font-bold py-4 px-4 rounded-sm transition-all duration-300 flex items-center justify-center gap-2 group -skew-x-12 border-2",
                  hasCopied
                    ? "bg-brand-primary border-brand-primary text-white hover:bg-brand-secondary"
                    : "bg-surface border-border-strong text-text-muted cursor-not-allowed opacity-50"
                )}
              >
                <span className="skew-x-12 uppercase tracking-widest">
                  {hasCopied ? "Close & Submit Another" : "Acknowledge & Close"}
                </span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-semantic-urgent/90 backdrop-blur-md text-white px-6 py-3 rounded-sm shadow-2xl border-b-4 border-red-950 -skew-x-6 animate-in fade-in slide-in-from-top-10 duration-300 pointer-events-none">
          <div className="skew-x-6 flex items-center gap-3 font-bold tracking-wider">
            <AlertCircle className="w-5 h-5" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
      
      <div className="mb-8 md:mb-12 max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight text-text-primary mb-4 border-l-4 border-brand-primary pl-4">Report a Blockage</h1>
        <p className="text-text-muted text-sm md:text-lg pl-5">Help prevent flooding by reporting clogged esteros and canals in your area. Our AI will automatically assess the severity and notify the local government.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Column (Photo & Notes) */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8">
          
          {/* Photo Upload Section */}
          <section className="bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-sm p-6 shadow-lg shadow-black/5 flex flex-col relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-primary/10 rounded-sm text-brand-primary -skew-x-6">
                  <Camera className="w-5 h-5 skew-x-6" />
                </div>
                <h2 className="text-lg font-bold text-text-primary uppercase tracking-wider">Photo Evidence</h2>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest bg-semantic-urgent text-white px-2 py-1 rounded-sm -skew-x-12 shadow-sm">
                <span className="skew-x-12 block">Required</span>
              </span>
            </div>
            
            {/* Hidden Inputs */}
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <canvas ref={canvasRef} className="hidden" />

            {!photoPreview ? (
              isCameraActive ? (
                <>
                  {isCameraExpanded ? createPortal(
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 lg:p-12">
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setIsCameraExpanded(false)} />
                      
                      {/* Stylized Container Wrapper */}
                      <div className="relative w-full h-full max-w-6xl bg-surface/90 backdrop-blur-2xl border border-brand-primary/30 rounded-sm shadow-[0_0_80px_-15px_rgba(var(--brand-primary),0.3)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 p-3 md:p-6 gap-4">
                        
                        {/* Header Bar */}
                        <div className="flex items-center justify-between px-2 shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-primary/20 rounded-sm text-brand-primary -skew-x-6">
                              <Camera className="w-5 h-5 skew-x-6" />
                            </div>
                            <h2 className="text-xl font-bold text-text-primary uppercase tracking-wider">Photo Capture</h2>
                          </div>
                        </div>

                        {/* Video Container */}
                        <div className="relative w-full flex-1 bg-black rounded-sm overflow-hidden border border-border-subtle shadow-inner flex flex-col group">
                          {renderCameraControls()}
                        </div>
                      </div>
                    </div>,
                    document.body
                  ) : (
                    <div className="relative w-full h-64 md:h-80 border border-border-subtle rounded-sm bg-black overflow-hidden flex flex-col group">
                      {renderCameraControls()}
                    </div>
                  )}
                  
                  {/* Placeholder block to prevent layout collapse when portal is active */}
                  {isCameraExpanded && (
                    <div className="relative w-full h-64 md:h-80 border-2 border-dashed border-border-subtle rounded-sm flex items-center justify-center bg-black/5">
                      <span className="text-text-muted font-bold flex items-center gap-2 animate-pulse">
                        <Camera className="w-5 h-5" />
                        Camera Expanded
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-56 md:h-72 border-2 border-dashed border-border-strong rounded-sm flex flex-col items-center justify-center gap-6 bg-app-bg/50">
                  <div className="text-center px-4">
                    <p className="font-bold text-text-primary text-xl">Add Photo Evidence</p>
                    <p className="text-sm text-text-muted mt-2">Take a live photo or upload from your device (Max 8MB)</p>
                  </div>

                  <div className="flex gap-4 w-full px-8 max-w-sm">
                    <button 
                      type="button"
                      onClick={() => startCamera('environment')}
                      className="flex-1 flex flex-col items-center justify-center gap-2 py-4 bg-brand-primary/10 border border-brand-primary/30 rounded-sm hover:bg-brand-primary hover:text-white transition-all group -skew-x-6 text-brand-primary shadow-sm"
                    >
                      <Camera className="w-7 h-7 skew-x-6 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold skew-x-6 uppercase tracking-wider">Camera</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex flex-col items-center justify-center gap-2 py-4 bg-surface border border-border-strong rounded-sm hover:border-brand-primary hover:bg-brand-primary/5 transition-all group -skew-x-6 text-text-primary shadow-sm"
                    >
                      <UploadCloud className="w-7 h-7 skew-x-6 text-text-secondary group-hover:text-brand-primary group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold skew-x-6 uppercase tracking-wider">Upload</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="relative w-full h-56 md:h-72 rounded-sm overflow-hidden group border border-border-subtle shadow-inner">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${photoPreview})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                
                <button 
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-4 right-4 p-2.5 bg-black/50 hover:bg-semantic-urgent backdrop-blur-md rounded-full text-white transition-all duration-300 hover:scale-110 hover:shadow-lg z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white text-sm font-bold bg-green-500/90 backdrop-blur-md px-4 py-2 rounded-sm -skew-x-12 shadow-lg z-10">
                  <span className="skew-x-12 flex items-center gap-2 tracking-wide uppercase">
                    <CheckCircle2 className="w-5 h-5" />
                    Image Attached
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Notes Section */}
          <section className="bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-sm p-6 shadow-lg shadow-black/5 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gray-500/10 rounded-sm text-text-secondary -skew-x-6">
                  <AlertCircle className="w-5 h-5 skew-x-6" />
                </div>
                <h2 className="text-lg font-bold text-text-primary uppercase tracking-wider">Notes</h2>
              </div>
              <span className="text-xs text-text-muted font-mono bg-app-bg px-2.5 py-1 rounded-sm border border-border-subtle shadow-sm -skew-x-6">
                <span className="skew-x-6 block">{notes.length}/280</span>
              </span>
            </div>

            <textarea 
              value={notes}
              maxLength={280}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide details about the blockage..."
              className="w-full flex-1 bg-app-bg/80 border border-border-subtle rounded-sm p-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all resize-none min-h-[140px] shadow-inner"
            />
          </section>

        </div>

        {/* Right Column (Map & Submit) */}
        <div className="lg:col-span-7 flex flex-col gap-6 lg:gap-8 h-full">
          <section className="bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-sm p-6 shadow-lg shadow-black/5 flex-1 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-secondary/10 rounded-sm text-brand-secondary -skew-x-6">
                  <MapPin className="w-5 h-5 skew-x-6" />
                </div>
                <h2 className="text-lg font-bold text-text-primary uppercase tracking-wider">Location</h2>
              </div>
              
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={handleLocateMe}
                  className="text-xs font-bold uppercase tracking-widest bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white px-3 py-1.5 rounded-sm -skew-x-12 transition-colors border border-brand-primary/30"
                >
                  <span className="skew-x-12 block">Locate Me</span>
                </button>
                <button 
                  type="button" 
                  onClick={toggleFullScreen}
                  className="text-xs font-bold uppercase tracking-widest bg-surface-subtle text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-sm -skew-x-12 transition-colors border border-border-subtle"
                >
                  <span className="skew-x-12 block">Full Screen</span>
                </button>
              </div>
            </div>

            <div 
              ref={mapContainerRef} 
              className={twMerge(
                "w-full flex-1 bg-app-bg border border-border-subtle rounded-sm overflow-hidden relative shadow-inner z-0 min-h-[300px]",
                mapStyle === 'dark' && "dark-map"
              )}
            >
              <MapContainer 
                center={position} 
                zoom={15} 
                scrollWheelZoom={true}
                zoomControl={false}
                className="w-full h-full z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker 
                  position={position} 
                  icon={customMarkerIcon} 
                  draggable={true}
                  eventHandlers={eventHandlers}
                  ref={markerRef}
                />
                <MapFlyTo position={position} defaultPosition={defaultPosition} />
                <CustomMapControls setMapStyle={setMapStyle} />
              </MapContainer>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] bg-surface border border-border-subtle px-5 py-2 rounded-sm shadow-xl flex items-center gap-3 -skew-x-12 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary"></div>
                <div className="skew-x-12 flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-primary"></span>
                  </span>
                  <span className="text-xs font-bold text-text-primary uppercase tracking-widest">Live Location</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-text-muted mt-5 flex items-start gap-2 bg-app-bg/50 p-3 rounded-sm border border-border-subtle">
              <AlertCircle className="w-5 h-5 shrink-0 text-brand-secondary" />
              <span>Drag the pin to adjust the exact location if the GPS is inaccurate.</span>
            </p>
          </section>

          {/* Submit Button */}
          <button 
            type="submit"
            className={twMerge(
              clsx(
                "w-full py-6 px-6 rounded-sm font-black text-xl tracking-widest uppercase flex items-center justify-center gap-3 transition-all duration-300 -skew-x-12 group shadow-[0px_4px_15px_rgba(0,0,0,0.1)]",
                photoPreview && !isSubmitting
                  ? "bg-brand-primary hover:bg-brand-secondary text-white hover:translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_rgba(0,0,0,0.2)]" 
                  : "bg-surface border-2 border-border-strong text-text-muted cursor-not-allowed opacity-80"
              )
            )}
            disabled={!photoPreview || isSubmitting}
          >
            <div className="skew-x-12 flex items-center gap-2">
              <span>{isSubmitting ? "Uploading..." : "Submit Report"}</span>
              {!isSubmitting && <ChevronRight className={twMerge(clsx("w-6 h-6 transition-transform", photoPreview && "group-hover:translate-x-2"))} />}
            </div>
          </button>

        </div>

      </form>
    </div>
  );
}
