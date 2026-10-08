import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Clock, Navigation, ArrowRight, Filter, ShieldAlert, Truck, MapPin, Maximize, Minimize, Crosshair } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../../lib/supabase';

// Custom Map Marker Icon
const criticalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const activeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const getMarkerIcon = (status: string, score: number, needsReview: boolean) => {
  if (status === 'failed_analysis' || needsReview) return activeIcon; // Orange for manual review
  if (status === 'dispatched') return activeIcon;
  if (status === 'resolved') return defaultIcon;
  
  if (status === 'triaged') {
    if (score >= 70) return criticalIcon;
    if (score >= 40) return activeIcon;
    return defaultIcon;
  }
  return defaultIcon; // Pending
};

export default function MainCommandDashboard() { 
  
  const [reports, setReports] = useState<any[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const mapRef = useRef<L.Map>(null);

  const goToCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapRef.current?.flyTo([latitude, longitude], 16, { duration: 1.5 });
        },
        (error) => {
          console.error("GPS Error:", error);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  useEffect(() => {
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setReports(data);
      }
    };
    
    fetchReports();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-app-bg text-text-primary select-none">
      
      {/* 1. The Map Background (Z-0) */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={[14.5995, 120.9842]} 
          zoom={14} 
          zoomControl={false}
          className="w-full h-full z-10"
          ref={mapRef}
        >
          {/* Default OSM with CSS Invert for Tactical Dark Look */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="invert hue-rotate-180 brightness-[0.8] contrast-[1.2]"
          />
          <ZoomControl position="bottomright" />
          
          {reports.map((report) => (
            <Marker 
              key={report.report_id} 
              position={[report.latitude, report.longitude]} 
              icon={getMarkerIcon(report.status, report.priority_score, report.needs_human_review)}
            >
              <Popup className="custom-popup">
                <div className="font-sans">
                  <h3 className="font-bold text-lg text-gray-900">{report.tracking_reference}</h3>
                  <p className={`text-sm font-semibold mb-1 ${report.priority_score >= 70 ? 'text-red-600' : 'text-orange-600'}`}>
                    {report.status === 'failed_analysis' ? 'MANUAL REVIEW REQUIRED' : `AI Score: ${report.priority_score || 'N/A'}`}
                  </p>
                  <p className="text-xs text-gray-600">{new Date(report.created_at).toLocaleString()}</p>
                  <button className="mt-3 w-full bg-brand-primary text-white text-xs font-bold py-2 rounded hover:bg-brand-secondary transition-colors">
                    VIEW FULL REPORT
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* 2. Floating Overlays (Z-50) */}
      <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
        
        {/* Header & KPI Strip - Top Left */}
        <div className="pointer-events-auto absolute top-4 left-4 z-30 flex flex-col gap-4">
          
          <div className="bg-surface/90 backdrop-blur-md border border-border-strong px-5 py-3 rounded-sm shadow-xl flex items-center gap-3 w-max">
            <ShieldAlert className="w-8 h-8 text-brand-primary" />
            <div>
              <h1 className="text-2xl font-heading font-black tracking-tight leading-tight">Tactical Command</h1>
              <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase">Live Dispatch Network</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="bg-surface/95 backdrop-blur-md border-l-4 border-semantic-urgent px-4 py-2 rounded-r-sm shadow-lg w-32">
              <div className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-1">Critical</div>
              <div className="text-3xl font-black text-semantic-urgent leading-none">
                {reports.filter(r => r.priority_score >= 70 && r.status === 'triaged').length}
              </div>
            </div>
            
            <div className="bg-surface/95 backdrop-blur-md border-l-4 border-semantic-warning px-4 py-2 rounded-r-sm shadow-lg w-32">
              <div className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-1">Review</div>
              <div className="text-3xl font-black text-semantic-warning leading-none">
                {reports.filter(r => r.status === 'failed_analysis' || r.needs_human_review).length}
              </div>
            </div>
          </div>
        </div>

        {/* Legend Overlay - Bottom Left */}
        <div className="pointer-events-auto absolute bottom-4 left-4 z-40 flex flex-col gap-3">
          <div className="bg-surface/90 backdrop-blur-md border border-border-strong p-3 rounded-sm shadow-lg flex items-center gap-4">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div> Critical
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> Review
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div> Resolved
            </div>
          </div>
          
          <button 
            onClick={goToCurrentLocation}
            className="bg-surface hover:bg-brand-primary/10 text-text-primary p-3 rounded-sm shadow-xl transition-all hover:scale-105 border border-border-strong group w-max"
            title="Find My Location"
          >
            <Crosshair className="w-6 h-6 text-brand-secondary group-hover:text-brand-primary" />
          </button>
        </div>

        {/* Floating Dispatch Queue - Right Panel */}
        <div 
          className={`pointer-events-auto absolute top-4 bottom-4 right-4 w-[28rem] z-30 transition-transform duration-500 ease-in-out ${isQueueOpen ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'}`}
        >
          <div className="w-full h-full bg-surface/95 backdrop-blur-xl border border-border-strong shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="p-4 border-b border-border-subtle bg-surface-subtle flex justify-between items-center relative">
              <h2 className="font-heading font-black text-sm tracking-widest uppercase flex items-center gap-2">
                <Navigation className="w-4 h-4 text-brand-primary" />
                Live Dispatch Queue
              </h2>
              <div className="flex items-center gap-2">
                <button className="p-1.5 hover:bg-surface rounded text-text-muted hover:text-brand-primary transition-colors">
                  <Filter className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsQueueOpen(false)}
                  className="p-1.5 hover:bg-surface rounded text-text-muted hover:text-brand-primary transition-colors bg-surface-subtle border border-border-subtle"
                >
                  <Minimize className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {reports.map((report) => {
                const isCritical = report.status === 'triaged' && report.priority_score >= 70;
                const needsReview = report.status === 'failed_analysis' || report.needs_human_review;
                
                return (
                  <div 
                    key={report.report_id}
                    className={`w-full p-4 border rounded-sm relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer ${
                      isCritical
                        ? 'border-semantic-urgent bg-semantic-urgent/10' 
                        : needsReview
                          ? 'border-semantic-warning bg-semantic-warning/10'
                          : 'border-border-subtle bg-app-bg hover:border-brand-primary/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono font-bold tracking-wider text-text-muted">{report.tracking_reference}</span>
                      
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm ${
                        isCritical ? 'bg-semantic-urgent text-white' :
                        needsReview ? 'bg-semantic-warning text-white' :
                        'bg-surface-subtle text-text-secondary border border-border-subtle'
                      }`}>
                        {needsReview ? 'NEEDS REVIEW' : report.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-text-primary text-base mb-1 truncate">
                      {report.citizen_notes || "No citizen notes provided"}
                    </h3>
                    
                    <div className="flex items-center gap-1 text-text-secondary text-[11px] mb-3">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">Lat: {report.latitude.toFixed(4)}, Lng: {report.longitude.toFixed(4)}</span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle/50">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-text-muted">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(report.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      
                      {isCritical ? (
                        <button className="text-[10px] font-black tracking-widest text-brand-white bg-semantic-urgent hover:bg-red-600 px-3 py-1.5 rounded-sm flex items-center gap-1 transition-colors">
                          <Truck className="w-3 h-3" /> DISPATCH
                        </button>
                      ) : (
                        <button className="text-[10px] font-black tracking-widest text-brand-primary hover:text-brand-secondary flex items-center gap-1">
                          DETAILS <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Toggle Button when Queue is minimized */}
        {!isQueueOpen && (
          <button
            onClick={() => setIsQueueOpen(true)}
            className="pointer-events-auto absolute right-0 top-4 z-30 flex h-[46px] w-12 items-center justify-center border border-r-0 border-border-strong bg-surface/90 text-text-primary shadow-lg backdrop-blur-md transition-colors hover:text-brand-primary rounded-l-sm"
          >
            <span className="font-bold">&lt;</span>
          </button>
        )}
        
      </div>
    </div>
  );
}
