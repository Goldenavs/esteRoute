import { useState, useRef, useEffect, useMemo, useId } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, MapPin, UploadCloud, CheckCircle2, ChevronRight, ChevronLeft,
  X, AlertCircle, RefreshCw, Zap, ZapOff, Layers, Plus, Minus,
  Copy, Check, Sun, Moon, Crosshair, Maximize2, Minimize2, ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

// Subtle, eye-friendly traveling perimeter highlight (matching Landing Page features)
const BorderBeam = ({ delay = 0, color = "#60A5FA" }: { delay?: number; color?: string }) => {
  const id = useId();
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm z-10">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3F72AF" stopOpacity="0" />
            <stop offset="50%" stopColor={color} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#3F72AF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx="2"
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="2.5"
          strokeDasharray="140 1200"
          animate={{
            strokeDashoffset: [1340, 0],
          }}
          transition={{
            duration: 9,
            delay,
            repeat: Infinity,
            ease: "linear",
          }}
          className="opacity-30 group-hover:opacity-95 transition-opacity duration-500"
        />
      </svg>
    </div>
  );
};

const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component to dynamically re-center map if geolocation successfully fetches on mount
function MapFlyTo({ position, defaultPosition }: { position: L.LatLng; defaultPosition: L.LatLng }) {
  const map = useMap();
  const hasInitiallyFlown = useRef(false);

  useEffect(() => {
    if (hasInitiallyFlown.current) return;
    if (!position || typeof position.lat !== 'number' || isNaN(position.lat) || typeof position.lng !== 'number' || isNaN(position.lng)) return;
    if (!defaultPosition || typeof defaultPosition.lat !== 'number' || isNaN(defaultPosition.lat)) return;

    if (position.lat !== defaultPosition.lat || position.lng !== defaultPosition.lng) {
      const container = map.getContainer();
      if (!container || container.clientWidth === 0 || container.clientHeight === 0) return;

      try {
        map.flyTo(position, 16, { animate: true, duration: 1.2 });
        hasInitiallyFlown.current = true;
      } catch (err) {
        console.warn("MapFlyTo skipped:", err);
      }
    }
  }, [map, position, defaultPosition]);
  return null;
}

// Component to trigger Leaflet map invalidateSize when container changes size or becomes visible
function MapResizeHandler({ active }: { active: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [active, map]);
  return null;
}

export type MapType = 'detailed' | 'simple';

// 100% Free OpenStreetMap tile servers with NO API key required
const getMapTileUrl = (type: MapType) => {
  if (type === 'detailed') {
    // Humanitarian OpenStreetMap - rich detail for canals, waterways, buildings & streets
    return 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
  }
  // Standard OpenStreetMap - clean, reliable, no API key required
  return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
};

// Off-screen indicator that dynamically points toward the pin when scrolled out of view
function OffscreenPinTracker({ position }: { position: L.LatLng }) {
  const map = useMap();
  const [isOffscreen, setIsOffscreen] = useState(false);
  const [indicator, setIndicator] = useState<{ x: number; y: number; angle: number; distanceM: number } | null>(null);

  useEffect(() => {
    const updateTracker = () => {
      if (!position || typeof position.lat !== 'number' || isNaN(position.lat) || typeof position.lng !== 'number' || isNaN(position.lng)) {
        setIsOffscreen(false);
        setIndicator(null);
        return;
      }

      const bounds = map.getBounds();
      if (!bounds.contains(position)) {
        const container = map.getContainer();
        const width = container.clientWidth;
        const height = container.clientHeight;

        if (width === 0 || height === 0) {
          setIsOffscreen(false);
          setIndicator(null);
          return;
        }

        const centerLatLng = map.getCenter();
        const pinPoint = map.latLngToContainerPoint(position);

        const centerX = width / 2;
        const centerY = height / 2;

        const dx = pinPoint.x - centerX;
        const dy = pinPoint.y - centerY;

        // Angle in degrees from center to pin (0° = East, 90° = South, 180° = West, -90° = North)
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = (angleRad * 180) / Math.PI;

        // Distance in meters
        let distanceM: number;
        try {
          distanceM = Math.round(centerLatLng.distanceTo(position));
        } catch {
          distanceM = 0;
        }

        // Margin from container edges
        const padX = 56;
        const padY = 56;

        const minX = padX;
        const maxX = width - padX;
        const minY = padY;
        const maxY = height - padY;

        // Ray-box intersection: find t where ray (centerX + t * dx, centerY + t * dy) hits the padding boundary
        let t = Infinity;

        if (dx > 0) {
          t = Math.min(t, (maxX - centerX) / dx);
        } else if (dx < 0) {
          t = Math.min(t, (minX - centerX) / dx);
        }

        if (dy > 0) {
          t = Math.min(t, (maxY - centerY) / dy);
        } else if (dy < 0) {
          t = Math.min(t, (minY - centerY) / dy);
        }

        if (!isFinite(t) || t <= 0) {
          setIsOffscreen(false);
          setIndicator(null);
          return;
        }

        const screenX = centerX + t * dx;
        const screenY = centerY + t * dy;

        setIsOffscreen(true);
        setIndicator({
          x: Math.max(minX, Math.min(maxX, screenX)),
          y: Math.max(minY, Math.min(maxY, screenY)),
          angle: angleDeg,
          distanceM,
        });
      } else {
        setIsOffscreen(false);
        setIndicator(null);
      }
    };

    updateTracker();
    map.on('move', updateTracker);
    map.on('zoom', updateTracker);
    map.on('resize', updateTracker);

    return () => {
      map.off('move', updateTracker);
      map.off('zoom', updateTracker);
      map.off('resize', updateTracker);
    };
  }, [map, position]);

  if (!isOffscreen || !indicator) return null;

  const formattedDistance = indicator.distanceM >= 1000
    ? `${(indicator.distanceM / 1000).toFixed(1)}km`
    : `${indicator.distanceM}m`;

  return (
    <div
      style={{
        left: `${indicator.x}px`,
        top: `${indicator.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
      className="absolute z-[450] pointer-events-auto transition-transform duration-75 select-none"
    >
      <button
        type="button"
        onClick={() => {
          try {
            map.flyTo(position, Math.max(map.getZoom(), 15), { animate: true, duration: 0.8 });
          } catch {
            // Ignore map fly error if layer is not yet fully ready
          }
        }}
        className="group flex items-center gap-2 px-3 py-1.5 bg-brand-primary hover:bg-brand-secondary text-white hover:text-black rounded-sm shadow-2xl border border-white/40 cursor-pointer active:scale-95 transition-all shadow-black/50 -skew-x-6"
        title="Pin is off-screen. Click to re-center on pin."
      >
        {/* Directional Arrow: ArrowRight natively points right (0°), rotating by indicator.angle points straight at pin */}
        <div
          className="w-4 h-4 flex items-center justify-center shrink-0 transition-transform skew-x-6"
          style={{ transform: `rotate(${indicator.angle}deg)` }}
        >
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </div>
        <div className="skew-x-6 flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider">
          <span>Pin</span>
          <span className="opacity-75 text-[9px]">({formattedDistance})</span>
        </div>
      </button>
    </div>
  );
}

// Component to render custom stylized controls inside the map
function CustomMapControls({
  isMapDark,
  setIsMapDark,
  mapType,
  setMapType,
  setPosition,
  toggleFullScreen,
  isFullscreen,
}: {
  isMapDark: boolean;
  setIsMapDark: React.Dispatch<React.SetStateAction<boolean>>;
  mapType: MapType;
  setMapType: React.Dispatch<React.SetStateAction<MapType>>;
  setPosition: React.Dispatch<React.SetStateAction<L.LatLng>>;
  toggleFullScreen: () => void;
  isFullscreen: boolean;
}) {
  const map = useMap();

  return (
    <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-[400] flex flex-col gap-1.5 sm:gap-2">
      {/* Zoom In */}
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="p-2 sm:p-2.5 bg-surface/90 backdrop-blur-md border border-border-subtle rounded-sm text-text-primary hover:bg-brand-primary hover:text-white transition-all shadow-md active:scale-95 -skew-x-6 cursor-pointer flex items-center justify-center"
        title="Zoom In"
        aria-label="Zoom In"
      >
        <Plus className="w-4 h-4 skew-x-6" />
      </button>

      {/* Zoom Out */}
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="p-2 sm:p-2.5 bg-surface/90 backdrop-blur-md border border-border-subtle rounded-sm text-text-primary hover:bg-brand-primary hover:text-white transition-all shadow-md active:scale-95 -skew-x-6 cursor-pointer flex items-center justify-center"
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        <Minus className="w-4 h-4 skew-x-6" />
      </button>

      <div className="w-full h-px bg-border-subtle my-0.5" />

      {/* Locate Me (Always available, even in Fullscreen mode!) */}
      <button
        type="button"
        onClick={() => {
          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                if (
                  pos?.coords &&
                  typeof pos.coords.latitude === 'number' &&
                  !isNaN(pos.coords.latitude) &&
                  typeof pos.coords.longitude === 'number' &&
                  !isNaN(pos.coords.longitude)
                ) {
                  const newPos = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
                  setPosition(newPos);
                  try {
                    map.flyTo(newPos, 16, { animate: true, duration: 1.2 });
                  } catch (err) {
                    console.warn("LocateMe flyTo error:", err);
                  }
                }
              },
              () => {
                alert("Could not access your location. Please check your browser permissions.");
              },
              { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
          }
        }}
        className="p-2 sm:p-2.5 bg-surface/90 backdrop-blur-md border border-border-subtle rounded-sm text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-md active:scale-95 -skew-x-6 cursor-pointer flex items-center justify-center"
        title="Locate Me (GPS)"
        aria-label="Locate Me"
      >
        <Crosshair className="w-4 h-4 skew-x-6" />
      </button>

      {/* Fullscreen Toggle Button */}
      <button
        type="button"
        onClick={toggleFullScreen}
        className="p-2 sm:p-2.5 bg-surface/90 backdrop-blur-md border border-border-subtle rounded-sm text-text-primary hover:bg-brand-primary hover:text-white transition-all shadow-md active:scale-95 -skew-x-6 cursor-pointer flex items-center justify-center"
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
        aria-label="Toggle Fullscreen"
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4 skew-x-6" /> : <Maximize2 className="w-4 h-4 skew-x-6" />}
      </button>

      <div className="w-full h-px bg-border-subtle my-0.5" />

      {/* Dedicated Map Theme Toggle (Sun / Moon) */}
      <button
        type="button"
        onClick={() => setIsMapDark(prev => !prev)}
        className={twMerge(
          "p-2 sm:p-2.5 backdrop-blur-md border rounded-sm transition-all shadow-md active:scale-95 -skew-x-6 cursor-pointer flex items-center justify-center",
          isMapDark
            ? "bg-surface/90 border-brand-primary/40 text-amber-400 hover:bg-brand-primary/20"
            : "bg-surface/90 border-border-subtle text-brand-primary hover:bg-brand-primary hover:text-white"
        )}
        title={isMapDark ? "Map: Dark Mode (Click for Light)" : "Map: Light Mode (Click for Dark)"}
        aria-label="Toggle Map Theme"
      >
        {isMapDark ? <Sun className="w-4 h-4 skew-x-6" /> : <Moon className="w-4 h-4 skew-x-6" />}
      </button>

      {/* Map Style Cycle: 1 vs 2 */}
      <button
        type="button"
        onClick={() => setMapType(prev => prev === 'detailed' ? 'simple' : 'detailed')}
        className={twMerge(
          "p-2 sm:p-2.5 backdrop-blur-md border rounded-sm transition-all shadow-md active:scale-95 -skew-x-6 cursor-pointer flex items-center justify-center gap-1",
          mapType === 'detailed'
            ? "bg-brand-primary text-white border-brand-primary shadow-brand-primary/30"
            : "bg-surface/90 border-border-subtle text-text-primary hover:bg-brand-secondary hover:text-black"
        )}
        title={mapType === 'detailed' ? "Map Style 1 (Click for Map Style 2)" : "Map Style 2 (Click for Map Style 1)"}
        aria-label="Cycle Map Style (1 / 2)"
      >
        <Layers className="w-3.5 h-3.5 skew-x-6" />
        <span className="font-mono text-[10px] font-bold skew-x-6">{mapType === 'detailed' ? '1' : '2'}</span>
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
  const { theme: globalTheme } = useTheme();
  const [isMapDark, setIsMapDark] = useState<boolean>(globalTheme === 'dark');
  const [mapType, setMapType] = useState<MapType>('detailed');

  // Synchronize map theme whenever the global navbar theme changes
  useEffect(() => {
    queueMicrotask(() => {
      setIsMapDark(globalTheme === 'dark');
    });
  }, [globalTheme]);

  const [hasCopied, setHasCopied] = useState(false);
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Geolocation State (Defaults to Cebu City Center)
  const defaultPosition = useMemo(() => new L.LatLng(10.3157, 123.8854), []);
  const [position, setPosition] = useState<L.LatLng>(defaultPosition);
  const markerRef = useRef<L.Marker>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Filter and detect real usable camera devices (excluding Windows Hello IR & virtual devices)
  const updateCameraCount = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => {
        if (device.kind !== 'videoinput') return false;
        const label = (device.label || '').toLowerCase();
        if (label.includes('ir ') || label.includes('infrared') || label.includes('virtual') || label.includes('obs')) {
          return false;
        }
        return true;
      });
      setCameraCount(videoDevices.length);
    } catch (err) {
      console.error("Could not enumerate devices", err);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      updateCameraCount();
    });
  }, []);

  // Suppress desktop navbar while camera viewfinder is active
  useEffect(() => {
    if (isCameraActive) {
      document.body.setAttribute('data-camera-active', 'true');
    } else {
      document.body.removeAttribute('data-camera-active');
    }
    return () => {
      document.body.removeAttribute('data-camera-active');
    };
  }, [isCameraActive]);

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
          if (
            pos?.coords &&
            typeof pos.coords.latitude === 'number' &&
            !isNaN(pos.coords.latitude) &&
            typeof pos.coords.longitude === 'number' &&
            !isNaN(pos.coords.longitude)
          ) {
            setPosition(new L.LatLng(pos.coords.latitude, pos.coords.longitude));
          }
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
          const latLng = marker.getLatLng();
          if (
            latLng &&
            typeof latLng.lat === 'number' &&
            !isNaN(latLng.lat) &&
            typeof latLng.lng === 'number' &&
            !isNaN(latLng.lng)
          ) {
            setPosition(latLng);
          }
        }
      },
    }),
    []
  );

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
    // If stream already exists, stop tracks cleanly
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      let stream: MediaStream;
      try {
        // First try to get the exact camera (front or back)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: mode } }
        });
      } catch {
        // If exact fails (e.g. laptop webcam has no 'environment'), fallback to ideal
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode } }
        });
      }

      streamRef.current = stream;
      setFacingMode(mode);
      setIsCameraActive(true);

      // Now that camera permission is granted, query real device labels to accurately detect usable camera count
      await updateCameraCount();
    } catch (fallbackErr) {
      console.error("Error accessing camera:", fallbackErr);
      showToast("Could not access camera. Please check permissions.");
    }
  };

  const toggleCamera = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';

    // Stop current stream tracks cleanly WITHOUT resetting isCameraActive
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: nextMode } }
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: nextMode } }
        });
      }

      streamRef.current = stream;
      setFacingMode(nextMode);

      // Seamlessly update video element stream without unmounting or reloading the modal
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.error("Error playing video:", err));
      }

      // Re-evaluate flashlight capability on the new camera
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as unknown as { torch?: boolean } | undefined;
      if (!capabilities?.torch) {
        setIsTorchOn(false);
      }
    } catch (err) {
      console.error("Error flipping camera:", err);
      showToast("Could not switch camera.");
    }
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

  const executeSubmit = async () => {
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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch(`${API_URL}/api/reports/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to submit report.");
      }

      const data = await response.json();
      setTrackingRef(data.tracking_reference);
      try {
        const stored: string[] = JSON.parse(localStorage.getItem('esteroute_my_reports') || '[]');
        if (data.tracking_reference && !stored.includes(data.tracking_reference)) {
          stored.unshift(data.tracking_reference);
          localStorage.setItem('esteroute_my_reports', JSON.stringify(stored));
        }
      } catch (storageErr) {
        console.warn("Could not save tracking ref to localStorage:", storageErr);
      }
      setIsSubmitted(true);
    } catch (error) {
      console.error("Submission error:", error);
      alert("There was an error submitting your report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) {
      showToast("Please capture or upload a photo to continue");
      return;
    }

    executeSubmit();
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setHasCopied(false);
    removePhoto();
    setNotes('');
    setMobileStep(1);
  };

  const handleCopy = () => {
    if (trackingRef) {
      navigator.clipboard.writeText(trackingRef);
      setHasCopied(true);
      showToast("Tracking number copied to clipboard!");
    }
  };

  const renderCameraModal = () => (
    <div className="fixed inset-0 z-[2000] w-full h-dvh bg-black overflow-hidden flex flex-col select-none animate-in fade-in duration-200">
      {/* 1. Full Screen Video Viewfinder (Fills entire screen) */}
      <div className="absolute inset-0 w-full h-full bg-black z-0 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={twMerge("w-full h-full object-cover", facingMode === 'user' && "scale-x-[-1]")}
        />

        {/* Minimalist Rule-of-Thirds Gridlines (Pointer-events-none) */}
        <div className="pointer-events-none absolute inset-0 z-10">
          {/* Vertical Lines */}
          <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/[0.08]" />
          <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/[0.08]" />
          {/* Horizontal Lines */}
          <div className="absolute left-0 right-0 top-1/3 h-px bg-white/[0.08]" />
          <div className="absolute left-0 right-0 top-2/3 h-px bg-white/[0.08]" />
        </div>
      </div>

      {/* 2. Floating Top Controls Overlay */}
      <div className="relative z-20 w-full px-5 sm:px-8 pt-4 sm:pt-6 pb-12 bg-gradient-to-b from-black/75 via-black/30 to-transparent flex items-center justify-between pointer-events-auto">
        {/* Floating Flashlight / Torch Button (Skewed) */}
        <button
          type="button"
          onClick={toggleTorch}
          className={twMerge(
            "p-2.5 sm:p-3 -skew-x-6 rounded-sm backdrop-blur-md transition-all duration-300 shadow-lg border cursor-pointer active:scale-95 flex items-center justify-center",
            isTorchOn
              ? "bg-brand-secondary text-black border-brand-secondary shadow-[0_0_15px_rgba(var(--brand-secondary),0.5)]"
              : "bg-black/60 border-white/20 text-white/90 hover:bg-black/80 hover:text-white"
          )}
          title="Toggle Flashlight"
        >
          {isTorchOn ? <Zap className="w-5 h-5 sm:w-6 sm:h-6 skew-x-6" /> : <ZapOff className="w-5 h-5 sm:w-6 sm:h-6 skew-x-6" />}
        </button>

        {/* Floating Red Close ("X") Button (Skewed) */}
        <button
          type="button"
          onClick={stopCamera}
          className="p-2.5 sm:p-3 -skew-x-6 rounded-sm bg-semantic-urgent hover:bg-red-600 border border-red-500/50 backdrop-blur-md text-white transition-all duration-300 shadow-lg shadow-red-950/40 cursor-pointer active:scale-95 flex items-center justify-center"
          title="Close Camera"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 skew-x-6 stroke-[2.5]" />
        </button>
      </div>

      {/* 3. Floating Bottom Controls Overlay */}
      <div className="mt-auto relative z-20 w-full px-6 sm:px-12 pb-8 sm:pb-12 pt-16 bg-gradient-to-t from-black/85 via-black/45 to-transparent grid grid-cols-3 items-center pointer-events-auto">
        {/* Left balance spacer */}
        <div className="flex justify-start">
          {/* Spacer to keep center shutter centered */}
        </div>

        {/* Center: Floating Shutter Button */}
        <div className="flex justify-center">
          <div className="p-1.5 border-4 border-white/80 rounded-full shadow-[0_0_35px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-90 transition-transform">
            <button
              type="button"
              onClick={capturePhoto}
              className="w-18 h-18 sm:w-20 sm:h-20 bg-white hover:bg-gray-200 rounded-full active:scale-90 transition-all flex items-center justify-center group cursor-pointer shadow-inner"
              aria-label="Capture Photo"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-black/25 group-hover:scale-95 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right: Floating Flip Camera Button (Rendered ONLY if multiple cameras exist!) */}
        <div className="flex justify-end">
          {cameraCount > 1 && (
            <button
              type="button"
              onClick={toggleCamera}
              className="p-3.5 -skew-x-6 rounded-sm bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/25 hover:border-white text-white transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center"
              title="Flip Camera"
            >
              <RefreshCw className="w-5 h-5 skew-x-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex-1 min-h-0 relative md:h-auto md:min-h-0 pb-4 md:pb-0 flex flex-col overflow-hidden md:overflow-visible">

      {/* Submission Success Modal */}
      <AnimatePresence>
        {isSubmitted && (
          <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative z-10 w-full max-w-md max-h-[92dvh] overflow-y-auto bg-surface/95 backdrop-blur-2xl border border-brand-primary/40 rounded-sm shadow-[0_0_80px_-10px_rgba(var(--brand-primary),0.4)] p-5 sm:p-7 md:p-8 flex flex-col items-center text-center my-auto"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-secondary via-brand-primary to-brand-secondary" />

              <div className="flex flex-col items-center text-center w-full">
                {/* Success Icon */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/15 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-inner border border-green-500/30 shrink-0">
                  <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                </div>

                {/* Title & Description */}
                <h2 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-text-primary mb-1.5 uppercase">
                  Report Submitted
                </h2>
                <p className="text-text-muted mb-4 sm:mb-6 text-xs sm:text-sm max-w-xs sm:max-w-sm leading-relaxed">
                  Thank you for keeping our community safe. Guest submissions cannot be tracked later unless you save this reference number.
                </p>

                {/* Tracking Reference Card (Skewed Container, Straight Text) */}
                <div className="w-full mb-4 sm:mb-6 flex flex-col gap-2">
                  <div className="bg-app-bg w-full p-3 sm:p-3.5 rounded-sm border border-border-subtle flex items-center justify-between gap-3 -skew-x-3 sm:-skew-x-6 relative shadow-inner">
                    <div className="skew-x-3 sm:skew-x-6 flex flex-col items-start gap-0.5 text-left">
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-text-muted">
                        Tracking Reference
                      </span>
                      <span className="text-lg sm:text-xl font-mono font-black text-brand-primary select-all tracking-wider">
                        {trackingRef || "ER-2026-000000"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={twMerge(
                        "skew-x-3 sm:skew-x-6 p-2 sm:p-2.5 rounded-sm transition-all duration-300 flex-shrink-0 border cursor-pointer active:scale-95 flex items-center justify-center",
                        hasCopied
                          ? "bg-green-500/20 text-green-500 border-green-500/30"
                          : "bg-surface text-text-primary hover:bg-brand-primary hover:text-white border-border-subtle shadow-sm"
                      )}
                      title="Copy Tracking Number"
                    >
                      {hasCopied ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>

                  {!hasCopied ? (
                    <div className="flex items-center justify-center gap-1.5 text-semantic-warning text-[10px] sm:text-xs font-bold uppercase tracking-wider animate-pulse pt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Please copy your reference number</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 text-green-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider pt-0.5">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Reference number copied to clipboard!</span>
                    </div>
                  )}
                </div>

                {/* Close Button (Skewed Container, Straight Text) */}
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full font-bold py-3 sm:py-3.5 px-4 rounded-sm transition-all duration-300 flex items-center justify-center gap-2 group -skew-x-3 sm:-skew-x-6 border-2 bg-brand-primary border-brand-primary text-white hover:bg-brand-secondary hover:text-black cursor-pointer active:scale-[0.99] shadow-lg shadow-brand-primary/20 shrink-0"
                >
                  <span className="skew-x-3 sm:skew-x-6 uppercase tracking-widest text-xs sm:text-sm font-black">
                    Close & Submit Another
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Toast Notification - Beautiful skewed industrial banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            transition={{ duration: 0.2 }}
            className="fixed top-6 left-1/2 z-[300] pointer-events-none"
          >
            <div className="bg-semantic-urgent text-white px-5 py-3 rounded-sm shadow-2xl border-b-4 border-red-950 -skew-x-3 lg:-skew-x-6">
              <div className="skew-x-3 lg:skew-x-6 flex items-center gap-3 font-bold tracking-wider text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{toastMessage}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header (Subheading hidden on mobile for maximum space) */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-1.5 md:mb-8 max-w-3xl shrink-0"
      >
        <h1 className="text-xl sm:text-2xl md:text-5xl font-heading font-black tracking-tight text-text-primary mb-0 md:mb-3 border-l-4 border-brand-primary pl-3 md:pl-4">
          Report a Blockage
        </h1>
        <p className="hidden md:block text-text-muted text-sm md:text-lg pl-5">
          Help prevent flooding by reporting clogged esteros and canals in your area. Our AI will automatically assess the severity and notify the local government.
        </p>
      </motion.div>

      {/* Mobile Stepper Header (3-Step Flow with Alive Pulsing Indicators & Consistent Skew) */}
      <div className="group lg:hidden mb-2 sm:mb-3 mx-1 bg-surface/35 hover:bg-surface/85 backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary transition-all duration-500 p-2 sm:p-2.5 rounded-sm shadow-sm hover:shadow-lg shrink-0 -skew-x-[2deg] relative overflow-hidden">
        <BorderBeam delay={0.2} />
        <div className="skew-x-[2deg] flex items-center justify-between relative z-20 px-2 sm:px-4">

          {/* Step 1: Photo */}
          <button
            type="button"
            onClick={() => setMobileStep(1)}
            className="flex-1 flex flex-col items-center gap-1 transition-transform active:scale-95 relative z-10 group"
          >
            <div className="relative">
              {/* Pulsing ambient halo when active */}
              {mobileStep === 1 && (
                <span className="absolute -inset-1 rounded-sm bg-brand-primary/40 animate-pulse blur-[3px] -skew-x-[3deg]" />
              )}
              <div className={twMerge(
                "relative w-8 h-8 rounded-sm -skew-x-[3deg] flex items-center justify-center text-xs font-mono font-bold transition-all border",
                mobileStep === 1
                  ? "bg-brand-primary text-white border-brand-primary shadow-[0_0_15px_rgba(var(--brand-primary),0.5)]"
                  : photoPreview
                    ? "bg-green-500/15 text-green-500 border-green-500/40"
                    : "bg-surface/80 text-text-muted border-border-subtle group-hover:border-text-muted"
              )}>
                <span className="skew-x-[3deg]">
                  {photoPreview && mobileStep !== 1 ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    "01"
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {mobileStep === 1 && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-80" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-primary" />
                </span>
              )}
              <span className={twMerge(
                "text-[10px] font-bold tracking-wider uppercase transition-colors font-mono",
                mobileStep === 1 ? "text-brand-primary" : photoPreview ? "text-text-primary" : "text-text-muted"
              )}>
                Photo
              </span>
            </div>
          </button>

          {/* Connector Line 1-2 */}
          <div className="h-[2px] w-8 sm:w-16 -mt-4 mx-1 transition-colors relative overflow-hidden bg-border-strong rounded-full">
            <div
              className={twMerge(
                "h-full transition-all duration-500",
                photoPreview
                  ? "w-full bg-gradient-to-r from-green-500 to-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                  : "w-0"
              )}
            />
          </div>

          {/* Step 2: Location */}
          <button
            type="button"
            onClick={() => {
              if (photoPreview) setMobileStep(2);
              else showToast("Please attach a photo first");
            }}
            className="flex-1 flex flex-col items-center gap-1 transition-transform active:scale-95 relative z-10 group"
          >
            <div className="relative">
              {/* Pulsing ambient halo when active */}
              {mobileStep === 2 && (
                <span className="absolute -inset-1 rounded-sm bg-brand-primary/40 animate-pulse blur-[3px] -skew-x-[3deg]" />
              )}
              <div className={twMerge(
                "relative w-8 h-8 rounded-sm -skew-x-[3deg] flex items-center justify-center text-xs font-mono font-bold transition-all border",
                mobileStep === 2
                  ? "bg-brand-primary text-white border-brand-primary shadow-[0_0_15px_rgba(var(--brand-primary),0.5)]"
                  : mobileStep > 2
                    ? "bg-green-500/15 text-green-500 border-green-500/40"
                    : "bg-surface/80 text-text-muted border-border-subtle group-hover:border-text-muted"
              )}>
                <span className="skew-x-[3deg]">
                  {mobileStep > 2 ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    "02"
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {mobileStep === 2 && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-80" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-primary" />
                </span>
              )}
              <span className={twMerge(
                "text-[10px] font-bold tracking-wider uppercase transition-colors font-mono",
                mobileStep === 2 ? "text-brand-primary" : mobileStep > 2 ? "text-text-primary" : "text-text-muted"
              )}>
                Location
              </span>
            </div>
          </button>

          {/* Connector Line 2-3 */}
          <div className="h-[2px] w-8 sm:w-16 -mt-4 mx-1 transition-colors relative overflow-hidden bg-border-strong rounded-full">
            <div
              className={twMerge(
                "h-full transition-all duration-500",
                mobileStep === 3
                  ? "w-full bg-gradient-to-r from-brand-primary to-brand-secondary shadow-[0_0_8px_rgba(var(--brand-primary),0.6)]"
                  : "w-0"
              )}
            />
          </div>

          {/* Step 3: Review & Submit */}
          <button
            type="button"
            onClick={() => {
              if (photoPreview) setMobileStep(3);
              else showToast("Please attach a photo first");
            }}
            className="flex-1 flex flex-col items-center gap-1 transition-transform active:scale-95 relative z-10 group"
          >
            <div className="relative">
              {/* Pulsing ambient halo when active */}
              {mobileStep === 3 && (
                <span className="absolute -inset-1 rounded-sm bg-brand-primary/40 animate-pulse blur-[3px] -skew-x-[3deg]" />
              )}
              <div className={twMerge(
                "relative w-8 h-8 rounded-sm -skew-x-[3deg] flex items-center justify-center text-xs font-mono font-bold transition-all border",
                mobileStep === 3
                  ? "bg-brand-primary text-white border-brand-primary shadow-[0_0_15px_rgba(var(--brand-primary),0.5)]"
                  : "bg-surface/80 text-text-muted border-border-subtle group-hover:border-text-muted"
              )}>
                <span className="skew-x-[3deg]">03</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {mobileStep === 3 && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-80" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-primary" />
                </span>
              )}
              <span className={twMerge(
                "text-[10px] font-bold tracking-wider uppercase transition-colors font-mono",
                mobileStep === 3 ? "text-brand-primary" : "text-text-muted"
              )}>
                Submit
              </span>
            </div>
          </button>

        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-8 overflow-hidden md:overflow-visible lg:items-stretch">

        {/* Left Column (Photo & Notes on Desktop; Steps 1 & 3 on Mobile) */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={twMerge(
            "lg:col-span-5 lg:flex lg:flex-col lg:gap-8 lg:h-full lg:justify-between",
            mobileStep === 1 || mobileStep === 3 ? "flex flex-1 min-h-0 flex-col gap-2 sm:gap-3" : "hidden"
          )}
        >

          {/* Photo Upload Section (Step 1 on mobile, always on desktop) */}
          <section className={twMerge(
            "group bg-surface/35 hover:bg-surface/85 backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary transition-all duration-500 rounded-sm p-3.5 sm:p-5 lg:p-6 shadow-sm hover:shadow-2xl hover:shadow-brand-primary/10 flex flex-col relative overflow-hidden",
            mobileStep === 1
              ? "flex-1 min-h-0 flex flex-col justify-between lg:flex-none lg:h-auto lg:justify-start"
              : "hidden lg:flex lg:flex-none lg:h-auto"
          )}>
            <BorderBeam delay={0} />
            <div className="relative z-20 flex flex-col flex-1 min-h-0 justify-between">
              <div className="flex items-center justify-between mb-2.5 lg:mb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 sm:p-2 bg-brand-primary/10 rounded-sm text-brand-primary -skew-x-[3deg] lg:-skew-x-6">
                    <Camera className="w-4 h-4 skew-x-[3deg] lg:skew-x-6" />
                  </div>
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-text-primary uppercase tracking-wider">Photo Evidence</h2>
                </div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-semantic-urgent text-white px-2 py-0.5 sm:py-1 rounded-sm -skew-x-[3deg] lg:-skew-x-12 shadow-sm">
                  <span className="skew-x-[3deg] lg:skew-x-12 block">Required</span>
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
                    {createPortal(renderCameraModal(), document.body)}
                    <div className="w-full flex-1 min-h-[160px] lg:flex-none lg:h-72 border-2 border-dashed border-brand-primary/50 rounded-sm flex flex-col items-center justify-center gap-3 bg-brand-primary/5 p-4 text-center">
                      <div className="p-3 bg-brand-primary/20 rounded-full text-brand-primary animate-pulse">
                        <Camera className="w-6 h-6 lg:w-8 lg:h-8" />
                      </div>
                      <div>
                        <p className="font-bold text-text-primary text-sm lg:text-base">Camera Viewfinder Active</p>
                        <p className="text-xs text-text-muted mt-0.5">Aiming in ~80% full-screen mode</p>
                      </div>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="text-xs font-bold uppercase tracking-wider text-semantic-urgent hover:underline mt-1 cursor-pointer"
                      >
                        Cancel Camera
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full flex-1 min-h-[160px] lg:flex-none lg:h-72 border-2 border-dashed border-border-strong rounded-sm flex flex-col items-center justify-center gap-3 lg:gap-5 bg-app-bg/50 p-3 lg:p-6">
                    <div className="text-center px-2">
                      <p className="font-bold text-text-primary text-base sm:text-lg lg:text-xl">Add Photo Evidence</p>
                      <p className="text-xs lg:text-sm text-text-muted mt-0.5 lg:mt-1">Take a live photo or upload from your device (Max 8MB)</p>
                    </div>

                    <div className="flex gap-3 lg:gap-4 w-full px-2 max-w-xs lg:max-w-sm">
                      <div className="flex-1 transition-transform active:scale-[0.96]">
                        <button
                          type="button"
                          onClick={() => startCamera('environment')}
                          className="w-full flex flex-col items-center justify-center gap-1.5 py-3 lg:py-3.5 bg-brand-primary/10 border border-brand-primary/30 rounded-sm hover:bg-brand-primary hover:text-white transition-colors group -skew-x-3 lg:-skew-x-6 text-brand-primary shadow-sm"
                        >
                          <Camera className="w-6 h-6 lg:w-7 lg:h-7 skew-x-3 lg:skew-x-6 group-hover:scale-110 transition-transform" />
                          <span className="text-xs lg:text-sm font-bold uppercase tracking-wider skew-x-3 lg:skew-x-6">Camera</span>
                        </button>
                      </div>

                      <div className="flex-1 transition-transform active:scale-[0.96]">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex flex-col items-center justify-center gap-1.5 py-3 lg:py-3.5 bg-surface border border-border-strong rounded-sm hover:border-brand-primary hover:bg-brand-primary/5 transition-colors group -skew-x-3 lg:-skew-x-6 text-text-primary shadow-sm"
                        >
                          <UploadCloud className="w-6 h-6 lg:w-7 lg:h-7 skew-x-3 lg:skew-x-6 text-text-secondary group-hover:text-brand-primary group-hover:scale-110 transition-transform" />
                          <span className="text-xs lg:text-sm font-bold uppercase tracking-wider skew-x-3 lg:skew-x-6">Upload</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="relative w-full flex-1 min-h-[160px] lg:flex-none lg:h-72 rounded-sm overflow-hidden group border border-border-subtle shadow-inner">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${photoPreview})` }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40 opacity-80 group-hover:opacity-100 transition-opacity"></div>

                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-3 right-3 p-2 sm:p-2.5 -skew-x-[3deg] lg:-skew-x-6 rounded-sm bg-semantic-urgent hover:bg-red-600 border border-red-500/50 backdrop-blur-md text-white transition-all duration-300 shadow-lg shadow-red-950/40 hover:scale-105 active:scale-95 z-10 flex items-center justify-center cursor-pointer"
                    title="Remove photo"
                    aria-label="Remove photo"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 skew-x-[3deg] lg:skew-x-6 stroke-[2.5]" />
                  </button>

                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-bold bg-green-500/90 backdrop-blur-md px-3 py-1.5 rounded-sm -skew-x-[3deg] lg:-skew-x-12 shadow-lg z-10">
                    <span className="skew-x-[3deg] lg:skew-x-12 flex items-center gap-1.5 tracking-wide uppercase">
                      <CheckCircle2 className="w-4 h-4" />
                      Image Attached
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Mobile Step 1 Actions (Consistent mild skew with glitch-free press wrapper) */}
          {mobileStep === 1 && (
            <div className="lg:hidden flex flex-col shrink-0 mt-2 px-1">
              <div className="w-full transition-transform active:scale-[0.98]">
                <button
                  type="button"
                  onClick={() => {
                    if (photoPreview) {
                      setMobileStep(2);
                    } else {
                      showToast("Please capture or upload a photo to continue");
                    }
                  }}
                  className={twMerge(
                    "w-full py-3.5 px-5 rounded-sm font-bold text-sm tracking-widest uppercase flex items-center justify-center -skew-x-3 lg:-skew-x-6 shadow-lg transition-colors",
                    photoPreview
                      ? "bg-brand-primary text-white hover:bg-brand-secondary cursor-pointer shadow-brand-primary/20"
                      : "bg-surface border border-border-strong text-text-muted cursor-not-allowed opacity-60"
                  )}
                >
                  <span className="skew-x-3 lg:skew-x-6 flex items-center gap-2">
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Notes Section (Step 3 on mobile, always on desktop) */}
          <section className={twMerge(
            "group bg-surface/35 hover:bg-surface/85 backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary transition-all duration-500 rounded-sm p-3.5 sm:p-5 lg:p-6 shadow-sm hover:shadow-2xl hover:shadow-brand-primary/10 flex flex-col relative overflow-hidden",
            mobileStep === 3 ? "flex flex-1 min-h-0" : "hidden lg:flex lg:flex-1"
          )}>
            <BorderBeam delay={1.5} />
            <div className="relative z-20 flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-gray-500/10 rounded-sm text-text-secondary -skew-x-[3deg] lg:-skew-x-6">
                    <AlertCircle className="w-4 h-4 skew-x-[3deg] lg:skew-x-6" />
                  </div>
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-text-primary uppercase tracking-wider">Notes</h2>
                </div>
                <span className="text-xs text-text-muted font-mono bg-app-bg px-2 py-0.5 rounded-sm border border-border-subtle shadow-sm -skew-x-[3deg] lg:-skew-x-6">
                  <span className="skew-x-[3deg] lg:skew-x-6 block">{notes.length}/280</span>
                </span>
              </div>

              <textarea
                value={notes}
                maxLength={280}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Provide details about the blockage..."
                className="w-full flex-1 min-h-[100px] lg:min-h-[140px] bg-app-bg/80 border border-border-subtle rounded-sm p-3.5 lg:p-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all resize-none shadow-inner"
              />
            </div>
          </section>

          {/* Review Summary Card & Mobile Step 3 Actions */}
          {mobileStep === 3 && (
            <div className="lg:hidden flex flex-col gap-2 shrink-0">
              {/* Review Summary Card with mild skew */}
              <div className="group bg-surface/35 hover:bg-surface/85 backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary transition-all duration-500 rounded-sm p-2.5 sm:p-3 mx-1 flex flex-col gap-2 shadow-sm hover:shadow-lg -skew-x-[2deg] lg:-skew-x-[4deg] relative overflow-hidden">
                <BorderBeam delay={2.2} />
                <div className="skew-x-[2deg] lg:skew-x-[4deg] flex flex-col gap-2 relative z-20">
                  <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Report Summary</span>
                    <span className="text-[10px] font-mono font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-sm border border-green-500/20">
                      Ready to Submit
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Photo thumbnail */}
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-sm overflow-hidden border border-border-subtle shrink-0 bg-black">
                      {photoPreview && (
                        <img src={photoPreview} alt="Report preview" className="w-full h-full object-cover" />
                      )}
                    </div>

                    {/* Location info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary mb-0.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-secondary shrink-0" />
                        <span className="truncate font-mono">
                          {position.lat.toFixed(4)}°, {position.lng.toFixed(4)}°
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted">
                        Pin placed on map
                      </p>
                    </div>

                    {/* Quick edit buttons */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setMobileStep(1)}
                        className="text-[10px] font-bold uppercase tracking-wider text-brand-primary hover:underline text-right"
                      >
                        Change Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileStep(2)}
                        className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary hover:underline text-right"
                      >
                        Adjust Pin
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Step 3 Actions (Back & Submit - Mildly skewed with glitch-free press wrapper) */}
              <div className="flex gap-2.5 px-1">
                <div className="transition-transform active:scale-[0.96]">
                  <button
                    type="button"
                    onClick={() => setMobileStep(2)}
                    className="h-full py-3 px-4 bg-surface border border-border-subtle hover:border-text-primary text-text-primary rounded-sm font-bold text-sm tracking-wider uppercase transition-colors -skew-x-3 lg:-skew-x-6 flex items-center justify-center"
                  >
                    <span className="skew-x-3 lg:skew-x-6 flex items-center gap-1.5">
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </span>
                  </button>
                </div>

                <div className="flex-1 transition-transform active:scale-[0.98]">
                  <button
                    type="submit"
                    disabled={!photoPreview || isSubmitting}
                    className={twMerge(
                      clsx(
                        "w-full py-3 px-5 rounded-sm font-black text-sm sm:text-base tracking-widest uppercase flex items-center justify-center transition-colors -skew-x-3 lg:-skew-x-6 shadow-lg",
                        photoPreview && !isSubmitting
                          ? "bg-brand-primary hover:bg-brand-secondary text-white cursor-pointer shadow-brand-primary/20"
                          : "bg-surface border-2 border-border-strong text-text-muted cursor-not-allowed opacity-80"
                      )
                    )}
                  >
                    <span className="skew-x-3 lg:skew-x-6 flex items-center gap-2">
                      <span>{isSubmitting ? "Uploading..." : "Submit Report"}</span>
                      {!isSubmitting && <ChevronRight className="w-4 h-4" />}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </motion.div>

        {/* Right Column (Map & Submit on Desktop; Step 2 on Mobile) */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
          className={twMerge(
            "lg:col-span-7 lg:flex lg:flex-col lg:gap-8 lg:h-full lg:justify-between",
            mobileStep === 2 ? "flex flex-1 min-h-0 flex-col justify-between" : "hidden"
          )}
        >
          <section className="group bg-surface/35 hover:bg-surface/85 backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary transition-all duration-500 rounded-sm p-3.5 sm:p-5 lg:p-6 shadow-sm hover:shadow-2xl hover:shadow-brand-primary/10 flex-1 min-h-0 flex flex-col min-h-[350px] lg:min-h-[520px] relative overflow-hidden">
            <BorderBeam delay={3} />
            <div className="relative z-20 flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="p-1.5 sm:p-2 bg-brand-secondary/10 rounded-sm text-brand-secondary -skew-x-3 lg:-skew-x-6">
                    <MapPin className="w-4 h-4 skew-x-3 lg:skew-x-6" />
                  </div>
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-text-primary uppercase tracking-wider">Location</h2>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-semantic-urgent text-white px-2 py-0.5 sm:py-1 rounded-sm -skew-x-[3deg] lg:-skew-x-12 shadow-sm">
                    <span className="skew-x-[3deg] lg:skew-x-12 block">Required</span>
                  </span>
                </div>
              </div>

              <div
                ref={mapContainerRef}
                className={twMerge(
                  "w-full flex-1 min-h-0 bg-app-bg border border-border-subtle rounded-sm overflow-hidden relative shadow-inner z-0 lg:min-h-[420px]",
                  isMapDark && "dark-map"
                )}
              >
                <MapContainer
                  center={position}
                  zoom={15}
                  scrollWheelZoom={true}
                  zoomControl={false}
                  attributionControl={false}
                  className="w-full h-full z-0"
                >
                  <TileLayer
                    key={`${mapType}-${isMapDark ? 'dark' : 'light'}`}
                    attribution=""
                    url={getMapTileUrl(mapType)}
                  />
                  <Marker
                    position={position}
                    icon={customMarkerIcon}
                    draggable={true}
                    eventHandlers={eventHandlers}
                    ref={markerRef}
                  />
                  <MapFlyTo position={position} defaultPosition={defaultPosition} />
                  <MapResizeHandler active={mobileStep === 2} />
                  <OffscreenPinTracker position={position} />
                  <CustomMapControls
                    isMapDark={isMapDark}
                    setIsMapDark={setIsMapDark}
                    mapType={mapType}
                    setMapType={setMapType}
                    setPosition={setPosition}
                    toggleFullScreen={toggleFullScreen}
                    isFullscreen={isFullscreen}
                  />
                </MapContainer>

                {/* Map Style & Mode Indicator (Bottom Left, no dot) */}
                <div className="absolute bottom-3 left-3 z-[400] bg-surface/90 backdrop-blur-md border border-border-subtle px-2.5 py-1 rounded-sm shadow-md flex items-center gap-1.5 -skew-x-3 pointer-events-none text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">
                  <span className="skew-x-3 flex items-center gap-1.5">
                    <span>{mapType === 'detailed' ? 'Map 1' : 'Map 2'}</span>
                    <span className="text-text-muted opacity-40">|</span>
                    <span className={isMapDark ? "text-amber-400" : "text-brand-primary"}>
                      {isMapDark ? 'Dark' : 'Light'}
                    </span>
                  </span>
                </div>
              </div>

              <p className="shrink-0 text-xs text-text-muted mt-2 flex items-center gap-2 bg-app-bg/50 p-2 rounded-sm border border-border-subtle -skew-x-[2deg] lg:-skew-x-[4deg]">
                <span className="skew-x-[2deg] lg:skew-x-[4deg] flex items-center gap-2 truncate">
                  <AlertCircle className="w-4 h-4 shrink-0 text-brand-secondary" />
                  <span className="truncate">Drag pin to adjust exact location.</span>
                </span>
              </p>
            </div>
          </section>

          {/* Mobile Step 2 Actions (Mildly skewed with glitch-free press wrapper) */}
          {mobileStep === 2 && (
            <div className="lg:hidden flex gap-2.5 shrink-0 mt-2 px-1">
              <div className="transition-transform active:scale-[0.96]">
                <button
                  type="button"
                  onClick={() => setMobileStep(1)}
                  className="h-full py-3 px-4 bg-surface border border-border-subtle hover:border-text-primary text-text-primary rounded-sm font-bold text-sm tracking-wider uppercase transition-colors -skew-x-3 lg:-skew-x-6 flex items-center justify-center"
                >
                  <span className="skew-x-3 lg:skew-x-6 flex items-center gap-1.5">
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </span>
                </button>
              </div>

              <div className="flex-1 transition-transform active:scale-[0.98]">
                <button
                  type="button"
                  onClick={() => setMobileStep(3)}
                  className="w-full py-3 px-5 bg-brand-primary text-white hover:bg-brand-secondary rounded-sm font-bold text-sm tracking-widest uppercase transition-colors -skew-x-3 lg:-skew-x-6 flex items-center justify-center shadow-lg shadow-brand-primary/20"
                >
                  <span className="skew-x-3 lg:skew-x-6 flex items-center gap-2">
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Submit Button (Desktop Only) */}
          <button
            type="submit"
            className={twMerge(
              clsx(
                "hidden lg:flex w-full py-5 lg:py-6 px-6 rounded-sm font-black text-xl tracking-widest uppercase items-center justify-center gap-3 transition-all duration-300 -skew-x-12 group shadow-[0px_4px_15px_rgba(0,0,0,0.1)] active:scale-[0.99] shrink-0",
                photoPreview && !isSubmitting
                  ? "bg-brand-primary hover:bg-brand-secondary text-white hover:translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_rgba(0,0,0,0.2)] cursor-pointer"
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

        </motion.div>

      </form>
    </div>
  );
}
