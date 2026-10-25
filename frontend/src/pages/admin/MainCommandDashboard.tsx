import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Clock, 
  Navigation, 
  ArrowRight, 
  ShieldAlert, 
  Truck, 
  MapPin, 
  Maximize2, 
  Minimize2, 
  CheckCircle, 
  BarChart3, 
  Plus, 
  Minus, 
  Crosshair, 
  Sun, 
  Moon, 
  Layers 
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../../lib/supabase';

export type MapTileType = 'detailed' | 'standard';
const getTileUrl = (type: MapTileType) => {
  if (type === 'detailed') {
    return 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
  }
  return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
};

// Custom Map Marker Icons
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

const pendingIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [29, 47],
  iconAnchor: [14, 47],
  popupAnchor: [1, -38],
  shadowSize: [45, 45]
});

const getMarkerIcon = (status: string, score: number, needsReview: boolean, isSelected?: boolean) => {
  if (isSelected) return selectedIcon;
  if (status === 'pending_analysis') return pendingIcon;
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

interface ReportItem {
  report_id: string;
  tracking_reference: string;
  latitude: number;
  longitude: number;
  status: string;
  priority_score: number;
  needs_human_review?: boolean;
  citizen_notes?: string;
  image_url?: string;
  created_at: string;
  displayLat: number;
  displayLng: number;
  coordIndex: number;
  locationGroup: ReportItem[];
}

export default function MainCommandDashboard() { 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reports, setReports] = useState<any[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(true);
  const [isKpiOpen, setIsKpiOpen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [visionResult, setVisionResult] = useState<any>(null);
  
  const mapRef = useRef<L.Map>(null);
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});

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

  // Group reports by location to handle stacked/overlapping coordinates
  const reportsByLocation = useMemo(() => {
    const map: { [key: string]: ReportItem[] } = {};
    reports.forEach((r) => {
      const key = `${Number(r.latitude).toFixed(4)},${Number(r.longitude).toFixed(4)}`;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [reports]);

  // Calculate display positions with subtle radial jitter for stacked/duplicate coordinates
  const reportsWithDisplayCoords = useMemo(() => {
    const coordCounts: { [key: string]: number } = {};
    return reports.map((report) => {
      const lat = Number(report.latitude);
      const lng = Number(report.longitude);
      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      const indexAtCoord = coordCounts[key] || 0;
      coordCounts[key] = indexAtCoord + 1;
      const group = reportsByLocation[key] || [report];

      if (indexAtCoord === 0) {
        return { 
          ...report, 
          displayLat: lat, 
          displayLng: lng, 
          coordIndex: 0,
          locationGroup: group
        };
      }
      // Slightly offset duplicate pins in a small radial circle (~15 meters) so every pin is distinct and clickable
      const totalAtLoc = group.length;
      const angle = (2 * Math.PI * indexAtCoord) / Math.max(totalAtLoc, 1);
      const radius = 0.00015;
      const displayLat = lat + radius * Math.sin(angle);
      const displayLng = lng + radius * Math.cos(angle);
      return { 
        ...report, 
        displayLat, 
        displayLng, 
        coordIndex: indexAtCoord,
        locationGroup: group
      };
    });
  }, [reports, reportsByLocation]);

  const [isMapDark, setIsMapDark] = useState<boolean>(true);
  const [mapType, setMapType] = useState<MapTileType>('standard');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'review' | 'analyzing' | 'resolved'>('all');

  // Computed metric counts
  const totalCount = reports.length;
  const criticalCount = useMemo(() => reports.filter(r => r.priority_score >= 70 && r.status === 'triaged').length, [reports]);
  const reviewCount = useMemo(() => reports.filter(r => r.status === 'failed_analysis' || r.needs_human_review).length, [reports]);
  const analyzingCount = useMemo(() => reports.filter(r => r.status === 'pending_analysis').length, [reports]);
  const resolvedCount = useMemo(() => reports.filter(r => r.status === 'resolved').length, [reports]);

  // Stylistic KPI Strip Filter metrics with visual proportion bars matching PublicEsteroStatusMap & CitizenDashboard
  const kpiMetrics = useMemo(() => [
    {
      filter: 'all' as const,
      label: 'TOTAL REPORTS',
      shortLabel: 'ALL',
      value: totalCount,
      subtext: 'All Command Pins',
      tone: 'text-text-primary',
      border: 'border-border-subtle',
      barBg: 'bg-brand-primary',
      pct: 100,
      pulse: false,
    },
    {
      filter: 'critical' as const,
      label: 'CRITICAL',
      shortLabel: 'CRIT',
      value: criticalCount,
      subtext: `${totalCount > 0 ? Math.round((criticalCount / totalCount) * 100) : 0}% High Urgency`,
      tone: 'text-red-400',
      border: 'border-red-500/40',
      barBg: 'bg-red-500',
      pct: totalCount > 0 ? Math.round((criticalCount / totalCount) * 100) : 0,
      pulse: criticalCount > 0,
    },
    {
      filter: 'review' as const,
      label: 'NEEDS REVIEW',
      shortLabel: 'REVIEW',
      value: reviewCount,
      subtext: `${totalCount > 0 ? Math.round((reviewCount / totalCount) * 100) : 0}% Human Check`,
      tone: 'text-amber-400',
      border: 'border-amber-500/40',
      barBg: 'bg-amber-500',
      pct: totalCount > 0 ? Math.round((reviewCount / totalCount) * 100) : 0,
      pulse: reviewCount > 0,
    },
    {
      filter: 'analyzing' as const,
      label: 'AI TRIAGE',
      shortLabel: 'TRIAGE',
      value: analyzingCount,
      subtext: `${totalCount > 0 ? Math.round((analyzingCount / totalCount) * 100) : 0}% In Pipeline`,
      tone: 'text-brand-primary',
      border: 'border-brand-primary/40',
      barBg: 'bg-brand-primary',
      pct: totalCount > 0 ? Math.round((analyzingCount / totalCount) * 100) : 0,
      pulse: analyzingCount > 0,
    },
    {
      filter: 'resolved' as const,
      label: 'RESOLVED',
      shortLabel: 'CLEARED',
      value: resolvedCount,
      subtext: `${totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0}% Restored`,
      tone: 'text-emerald-400',
      border: 'border-emerald-500/40',
      barBg: 'bg-emerald-500',
      pct: totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0,
      pulse: false,
    },
  ], [totalCount, criticalCount, reviewCount, analyzingCount, resolvedCount]);

  // Filtered reports for both the Map Markers and the Right Dispatch Queue
  const filteredReports = useMemo(() => {
    if (statusFilter === 'all') return reportsWithDisplayCoords;
    if (statusFilter === 'critical') {
      return reportsWithDisplayCoords.filter(r => r.priority_score >= 70 && r.status === 'triaged');
    }
    if (statusFilter === 'review') {
      return reportsWithDisplayCoords.filter(r => r.status === 'failed_analysis' || r.needs_human_review);
    }
    if (statusFilter === 'analyzing') {
      return reportsWithDisplayCoords.filter(r => r.status === 'pending_analysis');
    }
    if (statusFilter === 'resolved') {
      return reportsWithDisplayCoords.filter(r => r.status === 'resolved');
    }
    return reportsWithDisplayCoords;
  }, [reportsWithDisplayCoords, statusFilter]);

  const selectedReport = reportsWithDisplayCoords.find(r => r.report_id === selectedReportId);

  useEffect(() => {
    if (!selectedReportId) {
      // eslint-disable-next-line
      setVisionResult(null);
      return;
    }
    
    // Auto-pan to the selected report on the map
    const report = reportsWithDisplayCoords.find(r => r.report_id === selectedReportId);
    if (report && mapRef.current) {
      mapRef.current.flyTo([report.displayLat, report.displayLng], 17, { duration: 1.0 });

      // Automatically open the selected report's marker popup
      const timer = setTimeout(() => {
        const marker = markerRefs.current[selectedReportId];
        if (marker) {
          marker.openPopup();
        }
      }, 350);

      // Scroll queue card into view in the right panel
      const cardEl = document.getElementById(`queue-card-${selectedReportId}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      return () => clearTimeout(timer);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReportId]);

  const updateStatus = async (reportId: string, newStatus: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setReports(prev => prev.map(r => r.report_id === reportId ? { ...r, status: newStatus } : r));
      }
    } catch (error) {
      console.error("Failed to update status", error);
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
        // If map is at default position and we have reports, center on the first report
        if (data.length > 0 && mapRef.current) {
          const first = data[0];
          mapRef.current.setView([first.latitude, first.longitude], 14);
        }
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
      <div className={`absolute inset-0 z-0 transition-colors ${isMapDark ? 'dark-map' : ''}`}>
        <MapContainer 
          center={[10.3157, 123.8854]} 
          zoom={14} 
          zoomControl={false}
          attributionControl={false}
          className="w-full h-full z-10"
          ref={mapRef}
        >
          <TileLayer
            key={`${mapType}-${isMapDark ? 'dark' : 'light'}`}
            url={getTileUrl(mapType)}
          />
          
          {filteredReports.map((report) => {
            const isSelected = selectedReportId === report.report_id;
            const sameLocationReports = report.locationGroup || [];

            return (
              <Marker 
                key={report.report_id} 
                ref={(ref) => {
                  if (ref) {
                    markerRefs.current[report.report_id] = ref;
                  } else {
                    delete markerRefs.current[report.report_id];
                  }
                }}
                position={[report.displayLat, report.displayLng]} 
                icon={getMarkerIcon(report.status, report.priority_score, report.needs_human_review, isSelected)}
                zIndexOffset={isSelected ? 1000 : report.coordIndex * 10}
                eventHandlers={{
                  click: () => {
                    setSelectedReportId(report.report_id);
                  }
                }}
              >
                <Popup className="custom-popup" closeButton={false}>
                  <div className="bg-surface/95 backdrop-blur-md border border-border-strong rounded-sm shadow-2xl p-3 w-52 text-text-primary">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="font-mono font-bold text-xs text-text-muted tracking-widest">{report.tracking_reference}</h3>
                      {isSelected && (
                        <span className="text-[8px] font-bold uppercase tracking-wider bg-brand-primary/20 text-brand-primary border border-brand-primary/40 px-1 py-0.5 rounded">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <p className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm mt-1 mb-2 inline-block ${report.priority_score >= 70 ? 'bg-semantic-urgent text-white' : report.status === 'pending_analysis' ? 'bg-brand-primary text-white animate-pulse' : 'bg-semantic-warning text-white'}`}>
                      {report.status === 'pending_analysis' ? 'ANALYZING...' : report.status === 'failed_analysis' ? 'NEEDS REVIEW' : `AI Score: ${report.priority_score || 'N/A'}`}
                    </p>

                    <p className="text-[10px] text-text-muted mb-2 font-mono flex items-center justify-between">
                      <span>{new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[9px] opacity-75">Lat {report.latitude.toFixed(3)}, Lng {report.longitude.toFixed(3)}</span>
                    </p>

                    {/* Action / Selection Status */}
                    {isSelected ? (
                      <div className="w-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] font-black py-1.5 rounded-sm text-center uppercase tracking-widest flex items-center justify-center gap-1">
                        <CheckCircle className="w-3 h-3" /> ACTIVE IN COMMAND
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReportId(report.report_id);
                        }}
                        className="w-full bg-brand-primary text-brand-white text-[9px] font-black py-1.5 rounded-sm hover:bg-brand-secondary transition-colors uppercase tracking-widest transform -skew-x-[6deg] cursor-pointer"
                      >
                        <span className="inline-block transform skew-x-[6deg]">SELECT REPORT</span>
                      </button>
                    )}

                    {/* Multiple reports at this location switcher */}
                    {sameLocationReports.length > 1 && (
                      <div className="mt-2.5 pt-2 border-t border-border-subtle/70 text-[9px] text-text-muted">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-text-secondary">Location Cluster:</span>
                          <span className="font-mono text-[8px] bg-surface-subtle px-1 rounded">{sameLocationReports.length} reports</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sameLocationReports.map((other: ReportItem) => {
                            const isThisOne = other.report_id === report.report_id;
                            return (
                              <button
                                key={other.report_id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReportId(other.report_id);
                                }}
                                className={`px-1.5 py-0.5 rounded text-[8px] font-mono cursor-pointer transition-colors ${
                                  isThisOne 
                                    ? 'bg-brand-primary text-white font-bold shadow-xs' 
                                    : 'bg-surface hover:bg-surface-subtle text-text-secondary border border-border-subtle'
                                }`}
                                title={`Switch to ${other.tracking_reference}`}
                              >
                                {other.tracking_reference.replace('ER-2026-', '#')}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
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

        /* Hide default Leaflet controls completely */
        .leaflet-control-attribution,
        .leaflet-control-zoom {
          display: none !important;
        }

        /* Custom Scrollbar for side panels */
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(63, 114, 175, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(63, 114, 175, 0.8);
        }
      `}</style>
      
      {/* 2. Floating Overlays (Z-50) */}
      <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
        
        {/* Map Controls - Bottom Left (Auto-adjusts AI Vision panel) */}
        <div className={`pointer-events-auto absolute bottom-4 left-4 z-30 flex items-center gap-1.5 sm:gap-2 bg-surface/90 backdrop-blur-xl border border-border-strong p-1.5 rounded-sm shadow-2xl transition-all duration-500 ${!isFocusMode ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}`}>
          {/* Zoom In */}
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            className="p-2 sm:p-2.5 bg-surface/90 backdrop-blur-md border border-border-subtle rounded-sm text-text-primary hover:bg-brand-primary hover:text-white transition-all shadow-md active:scale-95 -skew-x-6 cursor-pointer flex items-center justify-center"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <Plus className="w-4 h-4 skew-x-6" />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            className="p-2 sm:p-2.5 bg-surface/90 backdrop-blur-md border border-border-subtle rounded-sm text-text-primary hover:bg-brand-primary hover:text-white transition-all shadow-md active:scale-95 -skew-x-6 cursor-pointer flex items-center justify-center"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <Minus className="w-4 h-4 skew-x-6" />
          </button>

          <div className="w-px h-6 bg-border-subtle my-auto" />

          {/* Locate Me (GPS) */}
          <button
            type="button"
            onClick={goToCurrentLocation}
            className="p-2 sm:p-2.5 bg-surface/90 backdrop-blur-md border border-border-subtle rounded-sm text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-md active:scale-95 -skew-x-6 cursor-pointer flex items-center justify-center"
            title="Locate Me (GPS)"
            aria-label="Locate Me"
          >
            <Crosshair className="w-4 h-4 skew-x-6" />
          </button>

          {/* Focus Mode Toggle (Zoom/Fullscreen icon) */}
          <button
            type="button"
            onClick={() => setIsFocusMode((v) => !v)}
            className={`p-2 sm:p-2.5 backdrop-blur-md border rounded-sm transition-all shadow-md active:scale-95 -skew-x-6 cursor-pointer flex items-center justify-center ${
              isFocusMode 
                ? 'bg-brand-primary text-white border-brand-primary' 
                : 'bg-surface/90 border-border-subtle text-text-primary hover:bg-brand-primary hover:text-white'
            }`}
            title={isFocusMode ? "Exit Focus Mode" : "Focus Mode (Fullscreen Map)"}
            aria-label="Toggle Focus Mode"
          >
            {isFocusMode ? <Minimize2 className="w-4 h-4 skew-x-6" /> : <Maximize2 className="w-4 h-4 skew-x-6" />}
          </button>

          <div className="w-px h-6 bg-border-subtle my-auto" />

          {/* Map Theme Toggle (Sun / Moon) */}
          <button
            type="button"
            onClick={() => setIsMapDark((prev) => !prev)}
            className={`p-2 sm:p-2.5 backdrop-blur-md border rounded-sm transition-all shadow-md active:scale-95 -skew-x-6 cursor-pointer flex items-center justify-center ${
              isMapDark
                ? "bg-surface/90 border-brand-primary/40 text-amber-400 hover:bg-brand-primary/20"
                : "bg-surface/90 border-border-subtle text-brand-primary hover:bg-brand-primary hover:text-white"
            }`}
            title={isMapDark ? "Map: Dark Mode (Click for Light)" : "Map: Light Mode (Click for Dark)"}
            aria-label="Toggle Map Theme"
          >
            {isMapDark ? <Sun className="w-4 h-4 skew-x-6" /> : <Moon className="w-4 h-4 skew-x-6" />}
          </button>

          {/* Map Style Cycle: 1 vs 2 */}
          <button
            type="button"
            onClick={() => setMapType((prev) => prev === 'detailed' ? 'standard' : 'detailed')}
            className={`p-2 sm:p-2.5 backdrop-blur-md border rounded-sm transition-all shadow-md active:scale-95 -skew-x-6 cursor-pointer flex items-center justify-center gap-1 ${
              mapType === 'detailed'
                ? "bg-brand-primary text-white border-brand-primary shadow-brand-primary/30"
                : "bg-surface/90 border-border-subtle text-text-primary hover:bg-brand-secondary hover:text-black"
            }`}
            title={mapType === 'detailed' ? "Map Style 1 (Click for Map Style 2)" : "Map Style 2 (Click for Map Style 1)"}
            aria-label="Cycle Map Style (1 / 2)"
          >
            <Layers className="w-3.5 h-3.5 skew-x-6" />
            <span className="font-mono text-[10px] font-bold skew-x-6">{mapType === 'detailed' ? '1' : '2'}</span>
          </button>

          <div className="w-px h-6 bg-border-subtle my-auto" />

          {/* Toggle KPI strip button */}
          <button
            type="button"
            onClick={() => setIsKpiOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 sm:py-2.5 backdrop-blur-md border rounded-sm transition-all shadow-md active:scale-95 -skew-x-6 cursor-pointer ${
              isKpiOpen 
                ? 'bg-brand-primary text-white border-brand-primary shadow-brand-primary/30' 
                : statusFilter !== 'all'
                  ? 'border-brand-primary/70 bg-brand-primary/10 text-brand-primary'
                  : 'bg-surface/90 border-border-subtle text-text-primary hover:bg-brand-primary hover:text-white'
            }`}
            title={isKpiOpen ? "Hide KPI Bar" : "Show KPI Bar"}
            aria-label="Toggle KPI Bar"
          >
            <BarChart3 className="w-4 h-4 skew-x-6" />
            <span className="text-[10px] font-bold tracking-wider uppercase skew-x-6 hidden sm:inline">
              {statusFilter !== 'all' ? statusFilter.toUpperCase() : isKpiOpen ? "HIDE KPI" : "SHOW KPI"}
            </span>
          </button>
        </div>

        {/* Bottom Center KPI Strip (Replacing bottom center area, exactly like Public Map & My Reports) */}
        <div 
          className={`pointer-events-auto absolute bottom-4 left-1/2 z-30 -translate-x-1/2 transition-all duration-500 ease-out ${
            (isKpiOpen && !isFocusMode) 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-24 opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2.5 bg-surface/85 backdrop-blur-xl border border-border-strong p-1.5 rounded-sm shadow-2xl">
              {kpiMetrics.map((metric) => {
                const isSelected = statusFilter === metric.filter;
                return (
                  <button
                    key={metric.label}
                    type="button"
                    onClick={() => setStatusFilter(prev => prev === metric.filter ? 'all' : metric.filter)}
                    className={twMerge(
                      "group relative overflow-hidden flex h-11 sm:h-13 min-w-[70px] sm:min-w-[96px] md:min-w-[114px] items-center border bg-surface/75 shadow-md backdrop-blur-md transition-all duration-300 hover:border-brand-primary -skew-x-2 sm:-skew-x-6 cursor-pointer text-left active:opacity-90",
                      metric.border,
                      isSelected 
                        ? "ring-1 sm:ring-2 ring-brand-primary opacity-100 z-10 bg-surface/95 shadow-md shadow-brand-primary/20" 
                        : "opacity-85 hover:opacity-100"
                    )}
                    title={`Filter by ${metric.label}: ${metric.value} reports (${metric.pct}%)`}
                  >
                    {/* Proportional Occupancy Fill Bar */}
                    <div 
                      className={twMerge(
                        "absolute inset-y-0 left-0 opacity-15 pointer-events-none transition-all duration-500",
                        metric.barBg
                      )}
                      style={{ width: `${metric.pct}%` }}
                    />

                    {/* Bottom Accent Bar */}
                    <div className="absolute bottom-0 left-0 h-0.5 sm:h-1 bg-border-subtle/50 w-full overflow-hidden">
                      <div 
                        className={twMerge("h-full transition-all duration-500", metric.barBg)}
                        style={{ width: `${metric.pct}%` }}
                      />
                    </div>

                    {/* Content (Unskewed) */}
                    <div className="relative z-10 flex w-full items-center justify-between gap-1 px-2 sm:px-2.5 py-1 skew-x-2 sm:skew-x-6">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8px] sm:text-[10px] font-mono font-bold tracking-wider uppercase text-text-secondary group-hover:text-brand-primary transition-colors truncate">
                          <span className="sm:hidden">{metric.shortLabel}</span>
                          <span className="hidden sm:inline">{metric.label}</span>
                        </span>
                        <span className="text-[7px] sm:text-[8px] font-mono text-text-muted tracking-tight truncate hidden md:inline">
                          {metric.subtext}
                        </span>
                      </div>
                      <span className={twMerge(
                        "text-xs sm:text-lg md:text-xl font-mono font-bold shrink-0 leading-none",
                        metric.tone,
                        metric.pulse && "animate-pulse"
                      )}>
                        {metric.value}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Collapse button for KPI */}
            <button 
              type="button"
              onClick={() => setIsKpiOpen(false)}
              className="bg-surface/90 hover:bg-surface border border-border-strong text-text-muted hover:text-brand-primary h-11 sm:h-13 w-6 flex items-center justify-center rounded-sm transition-colors -skew-x-6 cursor-pointer shadow-md"
              title="Hide KPI Bar"
              aria-label="Hide KPI Bar"
            >
               <span className="skew-x-6 font-bold text-xs">&times;</span>
            </button>
          </div>
        </div>

        {/* Left Panel: AI Vision Analysis (Auto-adjusts above bottom-left controls dock) */}
        <div 
          className={`pointer-events-auto absolute left-4 top-[5rem] bottom-[4.75rem] w-[24rem] z-20 transition-all duration-500 ease-out ${
            (isAnalysisOpen && !isFocusMode) ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'
          }`}
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

                  {/* Dispatcher Actions */}
                  <div className="pt-3 border-t border-border-subtle mt-auto">
                    <div className="text-[9px] uppercase font-bold text-text-muted mb-2 tracking-widest">Command Controls</div>
                    <div className="flex gap-2">
                      {selectedReport.status !== 'in_progress' && selectedReport.status !== 'resolved' && (
                        <button 
                          onClick={() => updateStatus(selectedReport.report_id, 'in_progress')}
                          className="flex-1 bg-brand-primary text-white text-[10px] font-black py-2.5 rounded-sm hover:bg-brand-secondary transition-colors uppercase tracking-widest transform -skew-x-[6deg] shadow-lg cursor-pointer hover:-translate-y-0.5"
                        >
                          <span className="transform skew-x-[6deg] flex items-center justify-center gap-2">
                            <Truck className="w-3.5 h-3.5" /> Dispatch Crew
                          </span>
                        </button>
                      )}
                      {selectedReport.status === 'in_progress' && (
                        <button 
                          onClick={() => updateStatus(selectedReport.report_id, 'resolved')}
                          className="flex-1 bg-emerald-600 text-white text-[10px] font-black py-2.5 rounded-sm hover:bg-emerald-500 transition-colors uppercase tracking-widest transform -skew-x-[6deg] shadow-lg cursor-pointer hover:-translate-y-0.5"
                        >
                          <span className="transform skew-x-[6deg] flex items-center justify-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                  
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

        {/* Right Panel: Dispatch Queue (w-[24rem] to match AI Vision panel) */}
        <div 
          className={`pointer-events-auto absolute bottom-4 right-4 top-[5rem] w-[24rem] z-20 transition-transform duration-500 ease-out ${(isQueueOpen && !isFocusMode) ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'}`}
        >
          <div className="w-full h-full bg-surface/95 backdrop-blur-xl border border-border-strong shadow-2xl flex flex-col rounded-sm">
            
            {/* Header */}
            <div className="p-4 border-b border-border-subtle bg-surface-subtle flex justify-between items-center relative rounded-t-sm">
              <h2 className="font-heading font-black text-sm tracking-widest uppercase flex items-center gap-2">
                <Navigation className="w-4 h-4 text-brand-primary" />
                Live Dispatch Queue
              </h2>
              <button 
                type="button"
                onClick={() => setIsQueueOpen(false)}
                className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center bg-surface hover:bg-surface-subtle border-l border-border-strong text-text-muted hover:text-brand-primary transition-colors cursor-pointer"
                aria-label="Collapse Dispatch Queue"
              >
                <span className="font-bold">&gt;</span>
              </button>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {filteredReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center p-6 border border-dashed border-border-subtle rounded-sm bg-app-bg/40">
                  <CheckCircle className="w-8 h-8 text-text-muted mb-2 opacity-50" />
                  <p className="font-heading text-xs font-bold uppercase tracking-widest text-text-secondary">
                    No {statusFilter !== 'all' ? statusFilter : ''} Reports
                  </p>
                  <p className="text-[11px] text-text-muted mt-1">
                    {statusFilter !== 'all' ? `No reports match the "${statusFilter}" filter.` : 'No reports available in queue.'}
                  </p>
                  {statusFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className="mt-3 text-[10px] font-bold text-brand-primary hover:underline uppercase tracking-wider cursor-pointer"
                    >
                      Clear Filter (Show All)
                    </button>
                  )}
                </div>
              ) : (
                filteredReports.map((report) => {
                  const isCritical = report.status === 'triaged' && report.priority_score >= 70;
                  const needsReview = report.status === 'failed_analysis' || report.needs_human_review;
                
                return (
                  <div 
                    key={report.report_id}
                    id={`queue-card-${report.report_id}`}
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
              }))}
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
