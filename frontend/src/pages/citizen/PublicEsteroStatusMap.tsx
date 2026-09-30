import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Info, Map as MapIcon, Layers } from 'lucide-react';

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
  return (
    <div className="w-full h-full flex flex-col pb-10">
      
      <div className="mb-6 md:mb-8 max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight text-text-primary mb-3 border-l-4 border-brand-primary pl-4">Public Basin Map</h1>
        <p className="text-text-muted text-sm md:text-lg pl-5">View active reports, drainage status, and real-time civic infrastructure alerts across the city.</p>
      </div>

      {/* Map Container Wrapper - Skewed for aesthetic but scales map to hide corners */}
      <div className="flex-1 w-full min-h-[65vh] bg-surface border border-border-subtle rounded-sm shadow-2xl relative overflow-hidden -skew-x-[2deg] lg:-skew-x-[6deg] group">
        
        {/* Un-skewed Map Layer */}
        <div className="skew-x-[2deg] lg:skew-x-[6deg] w-full h-full absolute inset-0 scale-[1.15]">
          <MapContainer 
            center={[10.3157, 123.8854]} 
            zoom={14} 
            scrollWheelZoom={true}
            className="w-full h-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
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

        {/* Floating UI Overlays */}
        <div className="absolute top-6 left-8 z-[400] skew-x-[2deg] lg:skew-x-[6deg] pointer-events-none">
           <div className="bg-surface/95 backdrop-blur-md border border-border-subtle p-3 lg:p-4 rounded-sm shadow-xl flex flex-col gap-2 -skew-x-[6deg] pointer-events-auto">
             <div className="skew-x-[6deg] flex flex-col gap-1">
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

        <div className="absolute bottom-6 right-8 z-[400] skew-x-[2deg] lg:skew-x-[6deg] pointer-events-none">
           <button className="bg-brand-primary hover:bg-brand-secondary text-white p-3 rounded-sm shadow-xl -skew-x-[6deg] transition-all hover:scale-105 pointer-events-auto flex items-center justify-center group/btn">
             <Layers className="w-6 h-6 skew-x-[6deg] group-hover/btn:rotate-12 transition-transform" />
           </button>
        </div>

      </div>

    </div>
  );
}
