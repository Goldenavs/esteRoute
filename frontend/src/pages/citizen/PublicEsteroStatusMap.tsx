import { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Map as MapIcon, Maximize, Minimize, Crosshair } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Fix for Vite static asset pathing
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function PublicEsteroStatusMap() { 
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef<L.Map>(null);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // After toggling layout, map might need a resize event to render tiles correctly
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 300);
  };

  const goToCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapRef.current?.flyTo([latitude, longitude], 16, { duration: 1.5 });
        },
        (error) => {
          alert('Unable to retrieve your location. Please check your browser permissions.');
          console.error("GPS Error:", error);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className={twMerge(
      clsx(
        "w-full flex-1 flex flex-col min-h-0",
        isFullscreen && "fixed inset-0 z-[999] bg-app-bg pb-0 h-screen"
      )
    )}>
      
      {!isFullscreen && (
        <div className="mb-3 md:mb-6 max-w-3xl shrink-0 px-1">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-heading font-black tracking-tight text-text-primary mb-2 border-l-4 border-brand-primary pl-3 md:pl-4">Public Basin Map</h1>
          <p className="text-text-muted text-[11px] md:text-sm pl-4 md:pl-5 line-clamp-2">View active reports, drainage status, and real-time civic infrastructure alerts across the city.</p>
        </div>
      )}

      {/* Map Container Wrapper - Conditionally skewed */}
      <div className={twMerge(
        clsx(
          "flex-1 min-h-0 w-full bg-surface border border-border-subtle shadow-2xl relative overflow-hidden group",
          isFullscreen ? "rounded-none" : "rounded-sm -skew-x-[2deg] lg:-skew-x-[6deg]"
        )
      )}>
        
        {/* Un-skewed Map Layer */}
        <div className={twMerge(
          clsx(
            "w-full h-full absolute inset-0 transition-transform duration-300",
            isFullscreen ? "scale-100" : "skew-x-[2deg] lg:skew-x-[6deg] scale-[1.15]"
          )
        )}>
          <MapContainer 
            center={[10.3157, 123.8854]} 
            zoom={14} 
            scrollWheelZoom={true}
            className="w-full h-full z-0"
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Dummy Markers for UI Presentation */}
            <Marker position={[10.3180, 123.8900]} icon={customMarkerIcon}>
               <Popup className="font-sans">
                 <div className="font-bold text-sm">Report #ER-101</div>
                 <div className="text-semantic-urgent text-xs mt-1">Status: Pending Review</div>
               </Popup>
            </Marker>
            
            <Marker position={[10.3120, 123.8810]} icon={customMarkerIcon}>
               <Popup className="font-sans">
                 <div className="font-bold text-sm">Report #ER-102</div>
                 <div className="text-brand-primary text-xs mt-1">Status: In Progress</div>
               </Popup>
            </Marker>

            <Marker position={[10.3200, 123.8750]} icon={customMarkerIcon}>
               <Popup className="font-sans">
                 <div className="font-bold text-sm">Report #ER-103</div>
                 <div className="text-green-500 text-xs mt-1">Status: Resolved</div>
               </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Floating Status Overlay */}
        <div className={twMerge(
          clsx(
            "absolute top-6 left-6 md:left-8 z-[400] pointer-events-none transition-transform duration-300",
            !isFullscreen && "skew-x-[2deg] lg:skew-x-[6deg]"
          )
        )}>
           <div className={twMerge(
             clsx(
               "bg-surface/95 backdrop-blur-md border border-border-subtle p-3 lg:p-4 rounded-sm shadow-xl flex flex-col gap-2 pointer-events-auto",
               !isFullscreen && "-skew-x-[6deg]"
             )
           )}>
             <div className={twMerge(clsx("flex flex-col gap-1", !isFullscreen && "skew-x-[6deg]"))}>
               <div className="flex items-center gap-2 mb-1">
                 <MapIcon className="w-5 h-5 text-brand-primary" />
                 <span className="font-black text-sm uppercase tracking-widest text-text-primary">Zone: Central Cebu</span>
               </div>
               <div className="flex items-center gap-2">
                 <AlertTriangle className="w-4 h-4 text-semantic-urgent" />
                 <span className="font-bold text-xs uppercase tracking-wider text-text-secondary">3 Active Reports</span>
               </div>
             </div>
           </div>
        </div>

        {/* Floating Action Controls */}
        <div className={twMerge(
          clsx(
            "absolute bottom-6 right-6 md:right-8 z-[400] pointer-events-none flex flex-col gap-3 transition-transform duration-300",
            !isFullscreen && "skew-x-[2deg] lg:skew-x-[6deg]"
          )
        )}>
           
           <button 
             onClick={goToCurrentLocation}
             className={twMerge(
               clsx(
                 "bg-surface hover:bg-brand-primary/10 text-text-primary p-3 rounded-sm shadow-xl transition-all hover:scale-105 pointer-events-auto flex items-center justify-center border border-border-subtle group",
                 !isFullscreen && "-skew-x-[6deg]"
               )
             )}
             title="Find My Location"
           >
             <Crosshair className={twMerge(clsx("w-6 h-6 text-brand-secondary group-hover:text-brand-primary", !isFullscreen && "skew-x-[6deg]"))} />
           </button>

           <button 
             onClick={toggleFullscreen}
             className={twMerge(
               clsx(
                 "bg-brand-primary hover:bg-brand-secondary text-white p-3 rounded-sm shadow-xl transition-all hover:scale-105 pointer-events-auto flex items-center justify-center group/btn",
                 !isFullscreen && "-skew-x-[6deg]"
               )
             )}
             title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
           >
             {isFullscreen ? (
               <Minimize className={twMerge(clsx("w-6 h-6 transition-transform group-hover/btn:scale-90", !isFullscreen && "skew-x-[6deg]"))} />
             ) : (
               <Maximize className={twMerge(clsx("w-6 h-6 transition-transform group-hover/btn:scale-110", !isFullscreen && "skew-x-[6deg]"))} />
             )}
           </button>

        </div>

      </div>

    </div>
  );
}
