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
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(true);
  const [isKpiOpen, setIsKpiOpen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [visionResult, setVisionResult] = useState<any>(null);
  
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

  const selectedReport = reports.find(r => r.report_id === selectedReportId);

  useEffect(() => {
    if (!selectedReportId) {
      setVisionResult(null);
      return;
    }
    
    // Auto-pan to the selected report on the map
    const report = reports.find(r => r.report_id === selectedReportId);
    if (report && mapRef.current) {
      mapRef.current.flyTo([report.latitude, report.longitude], 17, { duration: 1.2 });
    }
    
    const fetchVisionResult = async () => {
      const { data, error } = await supabase
        .from('agent_results')
        .select('*')
        .eq('report_id', selectedReportId)
        .eq('agent_type', 'vision_triage')
        .single();
        
      if (!error && data) {
        setVisionResult(data.result_json);
      } else {
        setVisionResult(null);
      }
    };
    
    fetchVisionResult();
    setIsAnalysisOpen(true);
  }, [selectedReportId]);

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
              <Popup className="custom-popup" closeButton={false}>
                <div className="bg-surface/95 backdrop-blur-md border border-border-strong rounded-sm shadow-2xl p-3 w-48 text-text-primary">
                  <h3 className="font-mono font-bold text-xs text-text-muted tracking-widest">{report.tracking_reference}</h3>
                  <p className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm mt-2 mb-2 inline-block ${report.priority_score >= 70 ? 'bg-semantic-urgent text-white' : 'bg-semantic-warning text-white'}`}>
                    {report.status === 'failed_analysis' ? 'NEEDS REVIEW' : `AI Score: ${report.priority_score || 'N/A'}`}
                  </p>
                  <p className="text-[10px] text-text-muted mb-2">{new Date(report.created_at).toLocaleTimeString()}</p>
                  <button 
                    onClick={() => setSelectedReportId(report.report_id)}
                    className="w-full bg-brand-primary text-brand-white text-[9px] font-black py-1.5 rounded-sm hover:bg-brand-secondary transition-colors uppercase tracking-widest transform -skew-x-[6deg]"
                  >
                    <span className="inline-block transform skew-x-[6deg]">SELECT REPORT</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Inline styles to nuke Leaflet's default white popup box */}
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: transparent;
          box-shadow: none;
          padding: 0;
          border-radius: 0;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .custom-popup .leaflet-popup-tip-container {
          display: none;
        }
      `}</style>
      
      {/* 2. Floating Overlays (Z-50) */}
      <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
        
        {/* Locate Device Button - Top Right (Safe from panels) */}
        <div className="pointer-events-auto absolute top-4 right-4 z-40 transition-all duration-500">
          <button 
            onClick={goToCurrentLocation}
            className="bg-surface/90 hover:bg-brand-primary/10 text-text-primary h-[38px] px-4 flex items-center justify-center gap-2 rounded-sm shadow-xl transition-all border border-border-strong group transform -skew-x-[6deg]"
            title="Find My Location"
          >
            <Navigation className="w-4 h-4 text-brand-secondary group-hover:text-brand-primary transform skew-x-[6deg]" />
            <span className="text-[10px] font-bold tracking-widest uppercase transform skew-x-[6deg]">Locate Me</span>
          </button>
        </div>
        
        {/* Bottom Left KPI & Legend Panel */}
        <div className={`pointer-events-auto absolute bottom-4 left-4 z-40 transition-transform duration-500 ease-out ${(isKpiOpen && !isFocusMode) ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'}`}>
          <div className="flex gap-2 items-end">
            <div className="bg-surface/90 backdrop-blur-md border border-border-strong p-2.5 rounded-sm shadow-lg transform -skew-x-[6deg] flex gap-5 w-max">
              <div className="transform skew-x-[6deg] flex gap-5 items-center">
                
                {/* Critical KPI */}
                <div className="flex flex-col items-center px-1">
                   <div className="text-xl font-black text-semantic-urgent leading-none">{reports.filter(r => r.priority_score >= 70 && r.status === 'triaged').length}</div>
                   <div className="text-[9px] uppercase tracking-widest font-bold text-text-muted mt-1">Critical</div>
                </div>
                
                {/* Review KPI */}
                <div className="flex flex-col items-center px-1 border-l border-border-subtle pl-5">
                   <div className="text-xl font-black text-semantic-warning leading-none">{reports.filter(r => r.status === 'failed_analysis' || r.needs_human_review).length}</div>
                   <div className="text-[9px] uppercase tracking-widest font-bold text-text-muted mt-1">Review</div>
                </div>
                
                {/* Legend */}
                <div className="flex flex-col gap-2 px-1 border-l border-border-subtle pl-5 justify-center">
                   <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div> Critical
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> Review
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div> Resolved
                   </div>
                </div>
                
              </div>
            </div>

            {/* Close button for KPI */}
            <button 
              onClick={() => setIsKpiOpen(false)}
              className="bg-surface/90 backdrop-blur-md border border-border-strong text-text-muted hover:text-brand-primary h-8 w-6 flex items-center justify-center rounded-sm transition-colors transform -skew-x-[6deg]"
            >
               <span className="transform skew-x-[6deg] font-bold text-xs">&lt;</span>
            </button>
          </div>
        </div>

        {/* Toggle for KPI when minimized */}
        {(!isKpiOpen && !isFocusMode) && (
          <button
            onClick={() => setIsKpiOpen(true)}
            className="pointer-events-auto absolute left-0 bottom-4 z-30 flex h-[48px] w-8 items-center justify-center border border-l-0 border-border-strong bg-surface/90 text-text-primary shadow-lg backdrop-blur-md transition-colors hover:text-brand-primary rounded-r-sm"
          >
            <span className="font-bold text-xs">&gt;</span>
          </button>
        )}

        {/* Focus Mode Toggle - Bottom Center */}
        <div className="pointer-events-auto absolute bottom-4 left-1/2 z-50 -translate-x-1/2">
            <button
                type="button"
                onClick={() => setIsFocusMode((v) => !v)}
                aria-label="Toggle Focus Mode"
                className="flex h-[38px] items-center justify-center gap-2 rounded-sm border border-border-strong bg-surface/90 px-6 text-text-primary shadow-lg backdrop-blur-md transition-colors hover:border-brand-primary hover:text-brand-primary font-label-caps text-[11px] font-bold tracking-widest transform -skew-x-[12deg] group"
            >
                <span className="inline-block transform skew-x-[12deg] flex items-center gap-2">
                    {isFocusMode ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
                    <span className="hidden sm:inline">FOCUS</span>
                </span>
            </button>
        </div>

        {/* Left Panel: AI Vision Analysis (Placeholder) */}
        <div 
          className={`pointer-events-auto absolute bottom-[6.5rem] left-4 top-[5rem] w-[24rem] z-20 transition-transform duration-500 ease-out ${(isAnalysisOpen && !isFocusMode) ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'}`}
        >
          <div className="w-full h-full bg-surface/95 backdrop-blur-xl border border-border-strong shadow-2xl flex flex-col rounded-sm">
            <div className="p-4 border-b border-border-subtle bg-surface-subtle flex justify-between items-center relative rounded-t-sm">
              <h2 className="font-heading font-black text-sm tracking-widest uppercase flex items-center gap-2 text-brand-primary">
                AI Vision Rationale
              </h2>
              <button 
                onClick={() => setIsAnalysisOpen(false)}
                className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center bg-surface hover:bg-surface-subtle border-l border-border-strong text-text-muted hover:text-brand-primary transition-colors"
              >
                <span className="font-bold">&lt;</span>
              </button>
            </div>
            {selectedReport ? (
              <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                <div className="p-4 flex flex-col gap-5">
                  
                  {/* Header / ID */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold tracking-wider text-text-muted">{selectedReport.tracking_reference}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm ${
                        selectedReport.status === 'triaged' && selectedReport.priority_score >= 70 ? 'bg-semantic-urgent text-white' :
                        (selectedReport.status === 'failed_analysis' || selectedReport.needs_human_review) ? 'bg-semantic-warning text-white' :
                        'bg-surface-subtle text-text-secondary border border-border-subtle'
                    }`}>
                      {selectedReport.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Submitted Image */}
                  <div className="w-full h-48 rounded-sm bg-border-subtle overflow-hidden relative group border border-border-strong shadow-inner">
                    <img src={selectedReport.image_url} alt="Reported issue" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      <span className="bg-black/50 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded">Vision Source</span>
                    </div>
                  </div>
                  
                  {/* AI Scores & Details */}
                  <div className="flex gap-3">
                    <div className="flex-1 bg-surface-subtle p-3 rounded-sm border border-border-subtle shadow-sm transform -skew-x-[6deg]">
                       <div className="transform skew-x-[6deg]">
                         <div className="text-[9px] uppercase font-bold text-text-muted mb-1 tracking-widest">Blockage Severity</div>
                         <div className="text-2xl font-black text-semantic-warning leading-none">{visionResult?.blockage_severity_score ?? selectedReport.priority_score ?? 'N/A'}<span className="text-sm text-text-muted">/100</span></div>
                       </div>
                    </div>
                    <div className="flex-1 bg-surface-subtle p-3 rounded-sm border border-border-subtle shadow-sm transform -skew-x-[6deg]">
                       <div className="transform skew-x-[6deg]">
                         <div className="text-[9px] uppercase font-bold text-text-muted mb-1 tracking-widest">Detected Waste</div>
                         <div className="flex flex-wrap gap-1 mt-1.5">
                           {(visionResult?.waste_categories || []).length > 0 ? (
                             (visionResult.waste_categories).map((c: string) => (
                                <span key={c} className="text-[8px] bg-brand-primary/10 border border-brand-primary/30 text-brand-primary px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">{c}</span>
                             ))
                           ) : (
                             <span className="text-[9px] text-text-muted italic">Scanning...</span>
                           )}
                         </div>
                       </div>
                    </div>
                  </div>
                  
                  {/* AI Rationale */}
                  <div>
                    <div className="text-[10px] uppercase font-bold text-brand-primary mb-2 tracking-widest flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> AI Assessment
                    </div>
                    <p className="text-sm text-text-primary leading-relaxed bg-surface p-4 border-l-2 border-brand-primary italic shadow-md">
                      "{visionResult?.rationale || 'Awaiting full AI visual analysis...'}"
                    </p>
                  </div>

                  {/* Citizen Notes */}
                  {selectedReport.citizen_notes && (
                    <div className="pt-2 border-t border-border-subtle">
                      <div className="text-[9px] uppercase font-bold text-text-muted mb-2 tracking-widest">Citizen Report Notes</div>
                      <p className="text-xs text-text-secondary leading-relaxed bg-surface-subtle p-3 rounded-sm border border-border-subtle">
                        {selectedReport.citizen_notes}
                      </p>
                    </div>
                  )}
                  
                </div>
              </div>
            ) : (
              <div className="flex-1 p-4 flex flex-col items-center justify-center text-text-muted text-xs border-[2px] border-dashed border-border-subtle m-4 bg-app-bg/50">
                <ShieldAlert className="w-8 h-8 mb-2 opacity-50" />
                <p className="tracking-widest uppercase font-bold opacity-50">Awaiting Target</p>
                <p className="mt-2 text-center px-4 opacity-50">Select a report from the queue to view the AI's analysis rationale.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Toggle Left Panel when Minimized */}
        {!isFocusMode && !isAnalysisOpen && (
          <button
            onClick={() => setIsAnalysisOpen(true)}
            className="pointer-events-auto absolute left-0 top-[5rem] z-30 flex h-[46px] w-12 items-center justify-center border border-l-0 border-border-strong bg-surface/90 text-text-primary shadow-lg backdrop-blur-md transition-colors hover:text-brand-primary rounded-r-sm"
          >
            <span className="font-bold">&gt;</span>
          </button>
        )}

        {/* Right Panel: Dispatch Queue */}
        <div 
          className={`pointer-events-auto absolute bottom-4 right-4 top-[5rem] w-[28rem] z-20 transition-transform duration-500 ease-out ${(isQueueOpen && !isFocusMode) ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'}`}
        >
          <div className="w-full h-full bg-surface/95 backdrop-blur-xl border border-border-strong shadow-2xl flex flex-col rounded-sm">
            
            {/* Header */}
            <div className="p-4 border-b border-border-subtle bg-surface-subtle flex justify-between items-center relative rounded-t-sm">
              <h2 className="font-heading font-black text-sm tracking-widest uppercase flex items-center gap-2">
                <Navigation className="w-4 h-4 text-brand-primary" />
                Live Dispatch Queue
              </h2>
              <div className="flex items-center gap-2 pr-10">
                <button className="p-1.5 hover:bg-surface rounded text-text-muted hover:text-brand-primary transition-colors">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
              <button 
                onClick={() => setIsQueueOpen(false)}
                className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center bg-surface hover:bg-surface-subtle border-l border-border-strong text-text-muted hover:text-brand-primary transition-colors"
              >
                <span className="font-bold">&gt;</span>
              </button>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {reports.map((report) => {
                const isCritical = report.status === 'triaged' && report.priority_score >= 70;
                const needsReview = report.status === 'failed_analysis' || report.needs_human_review;
                
                return (
                  <div 
                    key={report.report_id}
                    onClick={() => setSelectedReportId(report.report_id)}
                    className={`w-full p-4 border rounded-sm relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer ${
                      selectedReportId === report.report_id ? 'ring-2 ring-brand-primary shadow-xl z-10 scale-[1.02]' : ''
                    } ${
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
                        <button className="text-[10px] font-black tracking-widest text-brand-white bg-semantic-urgent hover:bg-red-600 px-4 py-1.5 transform -skew-x-[12deg] flex items-center gap-1 transition-colors">
                          <span className="inline-block transform skew-x-[12deg] flex items-center gap-1">
                             <Truck className="w-3 h-3" /> DISPATCH
                          </span>
                        </button>
                      ) : (
                        <button className="text-[10px] font-black tracking-widest text-brand-primary hover:text-brand-secondary flex items-center gap-1 group">
                          DETAILS <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Toggle Right Panel when Minimized */}
        {!isFocusMode && !isQueueOpen && (
          <button
            onClick={() => setIsQueueOpen(true)}
            className="pointer-events-auto absolute right-0 top-[5rem] z-30 flex h-[46px] w-12 items-center justify-center border border-r-0 border-border-strong bg-surface/90 text-text-primary shadow-lg backdrop-blur-md transition-colors hover:text-brand-primary rounded-l-sm"
          >
            <span className="font-bold">&lt;</span>
          </button>
        )}
        
      </div>
    </div>
  );
}
