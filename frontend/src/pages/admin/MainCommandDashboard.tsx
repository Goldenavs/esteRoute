import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Clock, 
  Navigation, 
  ArrowRight, 
  ShieldAlert, 
  MapPin, 
  RefreshCw,
  Loader2, 
  Maximize2, 
  Minimize2, 
  CheckCircle, 
  Plus, 
  Minus, 
  Crosshair, 
  Sun, 
  Moon, 
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Search,
  ArrowUpDown,
  X,
  Edit3,
  Route,
  ExternalLink
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../../lib/supabase';
import BorderBeam from '../../components/common/BorderBeam';
import { createEsteroMarkerIcon, createClusterIcon, createDepotMarkerIcon } from '../../lib/mapPins';

export type MapTileType = 'detailed' | 'standard';
const getTileUrl = (type: MapTileType) => {
  if (type === 'detailed') {
    return 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
  }
  return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
};

// Custom Map Marker Icons (Precision High-Grade SVG Vector Pins)
const getMarkerIcon = (status: string, score: number, needsReview: boolean, isSelected?: boolean) => {
  return createEsteroMarkerIcon({
    status,
    priorityScore: score,
    needsReview,
    isSelected
  });
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

export interface DispatchRouteInfo {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orderedStops: any[];
  totalDistanceKm: number;
  totalDurationMin: number;
  geometry: [number, number][];
  googleMapsUrl: string;
}

interface RouteOriginPoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const ROUTE_ORIGIN_PRESETS: RouteOriginPoint[] = [
  {
    id: 'cebu-hq',
    name: "Cebu City DPS Sanitation HQ",
    address: "M.C. Briones St, Cebu City Hall Complex",
    lat: 10.2934,
    lng: 123.9015
  },
  {
    id: 'mandaue-depot',
    name: "Mandaue City Engineering Depot",
    address: "Centro, Mandaue City Hall",
    lat: 10.3344,
    lng: 123.9421
  },
  {
    id: 'subangdaku-station',
    name: "Subangdaku Flood Control Substation",
    address: "M. Logarta Ave, Subangdaku River Basin",
    lat: 10.3242,
    lng: 123.9287
  },
  {
    id: 'lahug-base',
    name: "Lahug / Gorordo Emergency Base",
    address: "Gorordo Ave, North Cebu Corridor",
    lat: 10.3298,
    lng: 123.8967
  }
];

function OriginMapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function OriginMapFlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 14), { duration: 0.5 });
  }, [center, map]);
  return null;
}

function OriginMapResize() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

const createStopMarkerIcon = (stopNumber: number, priorityScore: number) => {
  const isUrgent = priorityScore >= 70;
  const bg = isUrgent ? 'linear-gradient(135deg, #EF4444, #B91C1C)' : 'linear-gradient(135deg, #F59E0B, #D97706)';
  const border = isUrgent ? '#F87171' : '#FBBF24';
  const shadow = isUrgent ? 'rgba(239, 68, 68, 0.7)' : 'rgba(245, 158, 11, 0.7)';

  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div class="relative flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group select-none">
        <div style="
          background: ${bg};
          border: 2px solid ${border};
          box-shadow: 0 0 16px ${shadow};
        " class="w-7 h-7 rounded-full text-white font-mono font-black text-xs flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-120">
          <span>${stopNumber}</span>
        </div>
        <div class="w-1.5 h-1.5 bg-red-500 rotate-45 border-r border-b border-white -mt-0.5"></div>
      </div>
    `,
    iconSize: [28, 34],
    iconAnchor: [14, 34],
    popupAnchor: [0, -36]
  });
};

function getClusterHighestStatus(reports: ReportItem[]): 'critical' | 'moderate' | 'dispatched' | 'resolved' | 'review' | 'pending' {
  if (reports.some(r => r.status === 'triaged' && (r.priority_score || 0) >= 70)) return 'critical';
  if (reports.some(r => r.status === 'failed_analysis' || r.needs_human_review)) return 'review';
  if (reports.some(r => r.status === 'dispatched')) return 'dispatched';
  if (reports.some(r => r.status === 'triaged')) return 'moderate';
  if (reports.some(r => r.status === 'pending_analysis')) return 'pending';
  return 'resolved';
}

interface CommandClusteredMarkersProps {
  reports: ReportItem[];
  selectedReportId: string | null;
  setSelectedReportId: (id: string) => void;
  markerRefs: React.RefObject<{ [key: string]: L.Marker | null }>;
  getMarkerIcon: (status: string, score: number, needsReview: boolean, isSelected?: boolean) => L.DivIcon;
}

function CommandClusteredMarkers({
  reports,
  selectedReportId,
  setSelectedReportId,
  markerRefs,
  getMarkerIcon,
}: CommandClusteredMarkersProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());

  useEffect(() => {
    const handleZoom = () => setZoom(map.getZoom());
    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map]);

  const clusters = useMemo(() => {
    // Zoom >= 15: show all individual markers (spiderfied by displayLat/displayLng)
    if (zoom >= 15) {
      return reports.map(r => ({
        id: r.report_id,
        lat: r.displayLat,
        lng: r.displayLng,
        reports: [r],
        highestStatus: getClusterHighestStatus([r]),
      }));
    }

    // Zoom < 15: Spatial proximity clustering
    // Keep selected report unclustered if present so its marker and popup stay visible
    const nonSelectedReports = selectedReportId
      ? reports.filter(r => r.report_id !== selectedReportId)
      : reports;

    const clusterRadius = 45 / Math.pow(2, zoom);
    const clusterList: {
      id: string;
      lat: number;
      lng: number;
      reports: ReportItem[];
      highestStatus: 'critical' | 'moderate' | 'dispatched' | 'resolved' | 'review' | 'pending';
    }[] = [];
    const visited = new Set<string>();

    for (let i = 0; i < nonSelectedReports.length; i++) {
      const report = nonSelectedReports[i];
      if (visited.has(report.report_id)) continue;

      const nearby: ReportItem[] = [report];
      visited.add(report.report_id);

      for (let j = i + 1; j < nonSelectedReports.length; j++) {
        const other = nonSelectedReports[j];
        if (visited.has(other.report_id)) continue;

        const dLat = Number(report.latitude) - Number(other.latitude);
        const dLng = Number(report.longitude) - Number(other.longitude);
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);

        if (dist < clusterRadius) {
          nearby.push(other);
          visited.add(other.report_id);
        }
      }

      const avgLat = nearby.reduce((sum, r) => sum + Number(r.latitude), 0) / nearby.length;
      const avgLng = nearby.reduce((sum, r) => sum + Number(r.longitude), 0) / nearby.length;

      clusterList.push({
        id: nearby.length === 1 ? report.report_id : `cluster-${report.report_id}-${nearby.length}`,
        lat: avgLat,
        lng: avgLng,
        reports: nearby,
        highestStatus: getClusterHighestStatus(nearby),
      });
    }

    if (selectedReportId) {
      const selected = reports.find(r => r.report_id === selectedReportId);
      if (selected) {
        clusterList.unshift({
          id: selected.report_id,
          lat: selected.displayLat,
          lng: selected.displayLng,
          reports: [selected],
          highestStatus: getClusterHighestStatus([selected]),
        });
      }
    }

    return clusterList;
  }, [reports, zoom, selectedReportId]);

  const renderSingleMarker = (report: ReportItem, isSelected: boolean) => {
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
        icon={getMarkerIcon(report.status, report.priority_score, !!report.needs_human_review, isSelected)}
        zIndexOffset={isSelected ? 1000 : (report.coordIndex || 0) * 10}
        eventHandlers={{
          click: () => {
            setSelectedReportId(report.report_id);
          }
        }}
      >
        <Popup className="custom-popup" closeButton={false}>
          <div className="bg-surface/95 backdrop-blur-md border border-border-strong rounded-sm shadow-2xl p-3 w-64 text-text-primary">
            {/* Header */}
            <div className="flex items-center justify-between gap-1 mb-2 border-b border-border-subtle pb-2">
              <div>
                <div className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
                  {report.tracking_reference}
                </div>
                <div className="text-xs font-heading font-black text-text-primary">
                  {report.status === 'resolved'
                    ? 'Cleared Waterway'
                    : report.status === 'dispatched'
                      ? 'Cleanup Dispatched'
                      : report.status === 'failed_analysis' || report.needs_human_review
                        ? 'Manual Review Needed'
                        : report.status === 'pending_analysis'
                          ? 'AI Triage in Progress'
                          : report.priority_score >= 70
                            ? 'Critical Constriction'
                            : 'Active Constriction'}
                </div>
              </div>

              <span className={twMerge(
                "text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm tracking-wider",
                report.status === 'resolved'
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : report.status === 'dispatched'
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : report.status === 'failed_analysis' || report.needs_human_review
                      ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                      : report.status === 'pending_analysis'
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : report.priority_score >= 70
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              )}>
                {report.status === 'resolved' ? 'RESOLVED' :
                 report.status === 'dispatched' ? 'DISPATCHED' :
                 report.status === 'failed_analysis' || report.needs_human_review ? 'REVIEW' :
                 report.status === 'pending_analysis' ? 'PENDING' :
                 `PRIORITY ${report.priority_score || 0}`}
              </span>
            </div>

            {/* Image Preview if available */}
            {report.image_url && (
              <div className="w-full h-28 mb-2 rounded-sm overflow-hidden border border-border-subtle bg-black/40 relative">
                <img 
                  src={report.image_url} 
                  alt="Canal Condition" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Notes */}
            <p className="text-[11px] text-text-secondary line-clamp-2 mb-2 leading-relaxed">
              "{report.citizen_notes || 'Citizen canal blockage observation.'}"
            </p>

            {/* Footer Info */}
            <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-1 border-t border-border-subtle">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-brand-primary font-bold">
                {report.status === 'resolved' 
                  ? 'Restored' 
                  : report.status === 'failed_analysis'
                    ? 'Needs Verification'
                    : (report.priority_score || 0) >= 70 
                      ? 'High Impact' 
                      : (report.priority_score || 0) < 40 
                        ? 'Low Impact' 
                        : 'Moderate'}
              </span>
            </div>

            {/* Action Buttons */}
            {(report.status === 'failed_analysis' || report.needs_human_review) && (
              <div className="mt-2.5 pt-2 border-t border-border-subtle flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReportId(report.report_id);
                    setTimeout(() => {
                      const el = document.getElementById('manual-triage-card');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full py-2 px-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-sm text-[11px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors active:scale-95"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Manual Verify Case</span>
                </button>
              </div>
            )}

            {/* Multiple reports at this location switcher */}
            {sameLocationReports.length > 1 && (
              <div className="mt-2 pt-2 border-t border-border-subtle/70 text-[9px] text-text-muted">
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
  };

  return (
    <>
      {clusters.map((cluster) => {
        if (cluster.reports.length === 1) {
          const report = cluster.reports[0];
          return renderSingleMarker(report, selectedReportId === report.report_id);
        }

        const resolvedCount = cluster.reports.filter(r => r.status === 'resolved').length;
        const activeCount = cluster.reports.length - resolvedCount;

        return (
          <Marker
            key={cluster.id}
            position={[cluster.lat, cluster.lng]}
            icon={createClusterIcon(cluster.reports.length, cluster.highestStatus)}
            zIndexOffset={500}
            eventHandlers={{
              click: () => {
                map.setView([cluster.lat, cluster.lng], Math.min(zoom + 3, 16), { animate: true });
              },
            }}
          >
            <Popup className="custom-popup" closeButton={false}>
              <div className="bg-surface/95 backdrop-blur-md border border-border-strong rounded-sm shadow-2xl p-3 w-64 text-text-primary font-sans">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-primary">
                    Sector Cluster
                  </span>
                  <span className={twMerge(
                    "text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm tracking-wider",
                    cluster.highestStatus === 'critical' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                    cluster.highestStatus === 'review' ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" :
                    cluster.highestStatus === 'dispatched' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                    cluster.highestStatus === 'pending' ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                    cluster.highestStatus === 'resolved' ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                    "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  )}>
                    {cluster.reports.length} Incidents
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary mb-2.5 leading-snug">
                  {activeCount === 0
                    ? `${cluster.reports.length} cleared blockage reports in this sector. All cleared!`
                    : `${cluster.reports.length} waterway incident reports grouped here (${resolvedCount} cleared, ${activeCount} active). Zoom in to inspect individual cases.`}
                </p>
                <button
                  type="button"
                  onClick={() => map.setView([cluster.lat, cluster.lng], Math.min(zoom + 3, 16), { animate: true })}
                  className="w-full py-1.5 px-2 bg-brand-primary hover:bg-brand-secondary !text-white hover:!text-black text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition-colors text-center cursor-pointer shadow-sm active:scale-95"
                >
                  Zoom into Sector ({cluster.reports.length})
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function MainCommandDashboard() { 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reports, setReports] = useState<any[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(true);
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [isKpiOpen, setIsKpiOpen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('map-fullscreen-change', { detail: { isFullscreen: isFocusMode } }));
    return () => {
      window.dispatchEvent(new CustomEvent('map-fullscreen-change', { detail: { isFullscreen: false } }));
    };
  }, [isFocusMode]);

  const toggleFocusMode = () => {
    if (isFocusMode) {
      setIsFocusMode(false);
      setIsAnalysisOpen(true);
      setIsQueueOpen(true);
      setIsKpiOpen(true);
      setIsControlsOpen(true);
    } else {
      setIsFocusMode(true);
      setIsAnalysisOpen(false);
      setIsQueueOpen(false);
      setIsKpiOpen(false);
      setIsControlsOpen(false);
    }
  };

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [visionResult, setVisionResult] = useState<any>(null);
  const [isReAssessing, setIsReAssessing] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [weatherResult, setWeatherResult] = useState<any>(null);
  const [manualSeverity, setManualSeverity] = useState<number>(70);
  const [manualWaste, setManualWaste] = useState<string[]>(['Plastic', 'Organic']);
  const [manualRationale, setManualRationale] = useState<string>('');
  const [isManualTriageSubmitting, setIsManualTriageSubmitting] = useState<boolean>(false);
  const [isManualEditOpen, setIsManualEditOpen] = useState<boolean>(false);
  const [isRouteMode, setIsRouteMode] = useState<boolean>(false);
  const [isGeneratingRoute, setIsGeneratingRoute] = useState<boolean>(false);
  const [dispatchRoute, setDispatchRoute] = useState<DispatchRouteInfo | null>(null);
  const [routeOrigin, setRouteOrigin] = useState<RouteOriginPoint>(ROUTE_ORIGIN_PRESETS[0]);
  const [isOriginModalOpen, setIsOriginModalOpen] = useState<boolean>(false);
  const [tempOrigin, setTempOrigin] = useState<RouteOriginPoint>(ROUTE_ORIGIN_PRESETS[0]);

  const calculateOptimalRoute = (activeList: ReportItem[], origin: RouteOriginPoint = routeOrigin) => {
    if (activeList.length === 0) return [];
    
    // Select top prioritized active blockage incidents (up to 6 stops)
    const candidates = [...activeList]
      .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
      .slice(0, 6);

    const ordered: ReportItem[] = [];
    let currentLat = origin.lat;
    let currentLng = origin.lng;

    const getDist = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const dLat = (lat2 - lat1) * 111.32;
      const dLng = (lng2 - lng1) * (111.32 * Math.cos((lat1 * Math.PI) / 180));
      return Math.sqrt(dLat * dLat + dLng * dLng);
    };

    const pool = [...candidates];
    while (pool.length > 0) {
      let bestIdx = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < pool.length; i++) {
        const candidate = pool[i];
        const distKm = getDist(currentLat, currentLng, Number(candidate.latitude), Number(candidate.longitude));
        const priority = Number(candidate.priority_score) || 50;
        // Priority-weighted utility: balances severity urgency with shortest transit detour
        const score = priority / (distKm + 0.7);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      const nextStop = pool.splice(bestIdx, 1)[0];
      ordered.push(nextStop);
      currentLat = Number(nextStop.latitude);
      currentLng = Number(nextStop.longitude);
    }

    return ordered;
  };

  const generateCleaningRoute = async (targetOrigin?: RouteOriginPoint) => {
    if (isGeneratingRoute) return;

    const origin = targetOrigin || routeOrigin;

    if (isRouteMode && !targetOrigin) {
      setIsRouteMode(false);
      return;
    }

    const activeList = reports.filter(r => r.status !== 'resolved');
    if (activeList.length === 0) {
      alert("No active canal blockage reports available to route. All current cases are resolved!");
      return;
    }

    setIsGeneratingRoute(true);

    try {
      const orderedStops = calculateOptimalRoute(activeList, origin);
      
      const waypoints = [
        [origin.lng, origin.lat],
        ...orderedStops.map(s => [Number(s.longitude), Number(s.latitude)])
      ];

      const coordsStr = waypoints.map(w => `${w[0]},${w[1]}`).join(';');
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;

      let geometry: [number, number][] = [];
      let totalDistanceKm = 0;
      let totalDurationMin = 0;

      try {
        const resp = await fetch(osrmUrl);
        if (resp.ok) {
          const data = await resp.json();
          if (data.routes && data.routes.length > 0) {
            const r = data.routes[0];
            totalDistanceKm = Math.round((r.distance / 1000) * 10) / 10;
            totalDurationMin = Math.round(r.duration / 60);
            geometry = r.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          }
        }
      } catch (osrmErr) {
        console.warn("OSRM routing API error, using tactical straight-line fallback:", osrmErr);
      }

      if (geometry.length === 0) {
        geometry = [
          [origin.lat, origin.lng],
          ...orderedStops.map(s => [Number(s.latitude), Number(s.longitude)] as [number, number])
        ];
        totalDistanceKm = Math.round(geometry.length * 2.6 * 10) / 10;
        totalDurationMin = Math.round(totalDistanceKm * 2.8);
      }

      const gMapsStops = [
        `${origin.lat},${origin.lng}`,
        ...orderedStops.map(s => `${s.latitude},${s.longitude}`)
      ].join('/');
      const googleMapsUrl = `https://www.google.com/maps/dir/${gMapsStops}`;

      setDispatchRoute({
        orderedStops,
        totalDistanceKm,
        totalDurationMin,
        geometry,
        googleMapsUrl
      });
      setIsRouteMode(true);

      if (mapRef.current && geometry.length > 0) {
        mapRef.current.fitBounds(L.latLngBounds(geometry), { padding: [80, 80] });
      }
    } catch (err) {
      console.error("Failed to generate route:", err);
    } finally {
      setIsGeneratingRoute(false);
    }
  };
  
  const mapRef = useRef<L.Map>(null);
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reportsRef = useRef<any[]>([]);
  const hasInitialCenteredRef = useRef<boolean>(false);
  const lastFlyTargetRef = useRef<string | null>(null);

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'review' | 'pending' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const activePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up active polling interval on unmount
  useEffect(() => {
    return () => {
      if (activePollRef.current) {
        clearInterval(activePollRef.current);
      }
    };
  }, []);

  // Computed metric counts
  const totalCount = reports.length;
  const criticalCount = useMemo(() => reports.filter(r => r.priority_score >= 70 && r.status === 'triaged').length, [reports]);
  const reviewCount = useMemo(() => reports.filter(r => r.status === 'failed_analysis' || r.needs_human_review).length, [reports]);
  const pendingCount = useMemo(() => reports.filter(r => r.status === 'pending_analysis').length, [reports]);
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
      filter: 'pending' as const,
      label: 'PENDING',
      shortLabel: 'PENDING',
      value: pendingCount,
      subtext: `${totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0}% In Pipeline`,
      tone: 'text-blue-400',
      border: 'border-blue-500/40',
      barBg: 'bg-blue-500',
      pct: totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0,
      pulse: pendingCount > 0,
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
  ], [totalCount, criticalCount, reviewCount, pendingCount, resolvedCount]);

  // Filtered reports for both the Map Markers and the Right Dispatch Queue
  const filteredReports = useMemo(() => {
    let result = reportsWithDisplayCoords;

    if (statusFilter === 'critical') {
      result = result.filter(r => r.priority_score >= 70 && r.status === 'triaged');
    } else if (statusFilter === 'review') {
      result = result.filter(r => r.status === 'failed_analysis' || r.needs_human_review);
    } else if (statusFilter === 'pending') {
      result = result.filter(r => r.status === 'pending_analysis');
    } else if (statusFilter === 'resolved') {
      result = result.filter(r => r.status === 'resolved');
    }

    // Filter by tracking reference or notes search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(r => 
        (r.tracking_reference && r.tracking_reference.toLowerCase().includes(q)) ||
        (r.report_id && r.report_id.toLowerCase().includes(q)) ||
        (r.citizen_notes && r.citizen_notes.toLowerCase().includes(q))
      );
    }

    // Sort by created_at newest or oldest
    return [...result].sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [reportsWithDisplayCoords, statusFilter, searchQuery, sortOrder]);

  const selectedReport = reportsWithDisplayCoords.find(r => r.report_id === selectedReportId);

  const fetchVisionResult = useCallback(async (reportId: string) => {
    const { data, error } = await supabase
      .from('agent_results')
      .select('*')
      .eq('report_id', reportId)
      .eq('agent_type', 'vision_triage')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (!error && data) {
      setVisionResult(data.result_json);
      if (data.result_json?.blockage_severity_score !== undefined) {
        setManualSeverity(Math.round(data.result_json.blockage_severity_score));
      }
      if (data.result_json?.waste_categories?.length) {
        setManualWaste(data.result_json.waste_categories);
      }
    } else {
      setVisionResult(null);
    }

    // Meteorological / Weather Result
    const { data: weatherData } = await supabase
      .from('agent_results')
      .select('*')
      .eq('report_id', reportId)
      .eq('agent_type', 'meteorological')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (weatherData) {
      setWeatherResult(weatherData.result_json);
    } else {
      const rep = reportsRef.current.find(r => r.report_id === reportId);
      if (rep?.latitude && rep?.longitude) {
        try {
          const mRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${rep.latitude}&longitude=${rep.longitude}&hourly=precipitation_probability&forecast_days=2&timezone=Asia/Manila`
          );
          if (mRes.ok) {
            const mJson = await mRes.json();
            const probs = mJson?.hourly?.precipitation_probability || [];
            const rpi = probs.length ? Math.max(...probs) : 0;
            setWeatherResult({ rain_probability_index: rpi, data_unavailable: false });
          } else {
            setWeatherResult(null);
          }
        } catch {
          setWeatherResult(null);
        }
      } else {
        setWeatherResult(null);
      }
    }
  }, []);

  const handleManualTriageSubmit = async () => {
    if (!selectedReport || isManualTriageSubmitting) return;
    setIsManualTriageSubmitting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let success = false;
      let newScore = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let newVision: any = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let newWeather: any = null;

      try {
        const res = await fetch(`${API_URL}/api/reports/${selectedReport.report_id}/manual-triage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            blockage_severity_score: manualSeverity,
            waste_categories: manualWaste,
            rationale: manualRationale || `Manual triage verified by LGU sanitation officer. Blockage Severity: ${manualSeverity}%.`
          })
        });

        if (res.ok) {
          const resJson = await res.json();
          success = true;
          newScore = resJson.priority_score;
          newVision = resJson.vision_result;
          newWeather = resJson.weather_result;
        }
      } catch (backendFetchErr) {
        console.warn("Backend API unreachable, using resilient direct Supabase fallback:", backendFetchErr);
      }

      // If backend was offline or failed, compute weather synthesis directly
      if (!success) {
        let rpi = weatherResult?.rain_probability_index ?? 0;
        if (!weatherResult) {
          try {
            const meteoRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${selectedReport.latitude}&longitude=${selectedReport.longitude}&hourly=precipitation_probability&forecast_days=2&timezone=Asia/Manila`
            );
            if (meteoRes.ok) {
              const meteoData = await meteoRes.json();
              const probs = meteoData?.hourly?.precipitation_probability || [];
              if (probs.length) rpi = Math.max(...probs);
            }
          } catch {
            rpi = 0;
          }
        }

        // Formula per SRS 3.6.2: 60% Vision Severity + 40% Rain Probability
        newScore = Math.round(((0.60 * manualSeverity) + (0.40 * rpi)) * 100) / 100;
        
        newVision = {
          report_id: selectedReport.report_id,
          is_valid_waterway: true,
          rejection_reason: null,
          waste_categories: manualWaste,
          blockage_severity_score: manualSeverity,
          confidence: 'high',
          rationale: manualRationale || `Manual triage verified by LGU sanitation officer. Blockage Severity: ${manualSeverity}%.`,
          is_manual_override: true
        };

        newWeather = {
          report_id: selectedReport.report_id,
          rain_probability_index: rpi,
          data_unavailable: false
        };

        await supabase
          .from('reports')
          .update({
            status: 'triaged',
            priority_score: newScore,
            needs_human_review: false
          })
          .eq('report_id', selectedReport.report_id);

        await supabase
          .from('dispatch_status_log')
          .insert({
            report_id: selectedReport.report_id,
            to_status: 'triaged'
          });

        await supabase
          .from('agent_results')
          .insert({
            report_id: selectedReport.report_id,
            agent_type: 'vision_triage',
            result_json: newVision
          });
      }

      // Instant state reflection
      setReports(prev => prev.map(r => r.report_id === selectedReport.report_id ? {
        ...r,
        status: 'triaged',
        priority_score: newScore,
        needs_human_review: false
      } : r));
      if (newVision) setVisionResult(newVision);
      if (newWeather) setWeatherResult(newWeather);
      setIsManualEditOpen(false);

    } catch (err) {
      console.error("Failed to apply manual triage:", err);
    } finally {
      setIsManualTriageSubmitting(false);
    }
  };

  const handleReAssess = async (reportId: string) => {
    if (isReAssessing) return;
    setIsReAssessing(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${API_URL}/api/reports/${reportId}/re-assess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        // Optimistically set status to pending_analysis & clear existing vision result
        setReports(prev => prev.map(r => r.report_id === reportId ? { ...r, status: 'pending_analysis', needs_human_review: false } : r));
        setVisionResult(null);

        // Clear any prior poll
        if (activePollRef.current) clearInterval(activePollRef.current);

        // Active poll watcher: check report status every 1.5s to ensure immediate UI update on success or failure without page refresh
        let attempts = 0;
        const maxAttempts = 20; // 20 * 1.5s = 30s
        activePollRef.current = setInterval(async () => {
          attempts += 1;
          try {
            const { data: updatedReport, error: pollErr } = await supabase
              .from('reports')
              .select('*')
              .eq('report_id', reportId)
              .maybeSingle();

            if (!pollErr && updatedReport) {
              if (updatedReport.status !== 'pending_analysis') {
                if (activePollRef.current) clearInterval(activePollRef.current);
                // Instantly update reports state so the UI reflects the result (triaged or failed_analysis)
                setReports(prev => prev.map(r => r.report_id === reportId ? { ...r, ...updatedReport } : r));
                if (updatedReport.status === 'triaged' || updatedReport.status === 'failed_analysis') {
                  fetchVisionResult(reportId);
                }
                setIsReAssessing(false);
              }
            }
          } catch (pollCheckErr) {
            console.warn("Status watcher check error:", pollCheckErr);
          }

          if (attempts >= maxAttempts) {
            if (activePollRef.current) clearInterval(activePollRef.current);
            setIsReAssessing(false);
          }
        }, 1500);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Failed to re-assess report:", errData);
        setIsReAssessing(false);
      }
    } catch (error) {
      console.error("Failed to re-assess report:", error);
      setIsReAssessing(false);
    }
  };

  useEffect(() => {
    if (!selectedReportId) {
      // eslint-disable-next-line
      setVisionResult(null);
      lastFlyTargetRef.current = null;
      return;
    }

    // Always fetch AI diagnostics and ensure drawer is open for selected report
    fetchVisionResult(selectedReportId);
    setIsAnalysisOpen(true);
    
    // Auto-pan to the selected report on the map ONLY if target changed
    if (lastFlyTargetRef.current !== selectedReportId) {
      lastFlyTargetRef.current = selectedReportId;
      const report = reportsWithDisplayCoords.find(r => r.report_id === selectedReportId);
      if (report && mapRef.current) {
        const currentZoom = mapRef.current.getZoom();
        const currentCenter = mapRef.current.getCenter();
        const dist = currentCenter.distanceTo([report.displayLat, report.displayLng]);

        // If map is already at zoom 17 and within 15 meters, do not re-run flyTo animation
        if (currentZoom === 17 && dist < 15) {
          markerRefs.current[selectedReportId]?.openPopup();
        } else {
          mapRef.current.flyTo([report.displayLat, report.displayLng], 17, { duration: 0.8 });

          const timer = setTimeout(() => {
            const marker = markerRefs.current[selectedReportId];
            if (marker) {
              marker.openPopup();
            }
          }, 850);

          return () => clearTimeout(timer);
        }

        // Scroll queue card into view in the right panel
        const cardEl = document.getElementById(`queue-card-${selectedReportId}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
  }, [selectedReportId, fetchVisionResult, reportsWithDisplayCoords]);

  const updateStatus = async (reportId: string, newStatus: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${API_URL}/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setReports(prev => {
          const next = prev.map(r => r.report_id === reportId ? { ...r, status: newStatus } : r);
          reportsRef.current = next;
          return next;
        });
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  useEffect(() => {
    const fetchReports = async () => {
      // Safety Barrier 1: Active-first incident triage & bounded retention query
      // Real-time command dashboard prioritizes all active cases plus recent resolved cases (<14 days).
      const fourteenDaysAgoIso = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .or(`status.neq.resolved,created_at.gte.${fourteenDaysAgoIso}`)
        .order('created_at', { ascending: false })
        .limit(150);
      
      if (!error && data) {
        reportsRef.current = data;
        setReports(data);
        // Only center map on the first report once upon initial load! Never reset on subsequent fetches or updates!
        if (!hasInitialCenteredRef.current && data.length > 0 && mapRef.current) {
          hasInitialCenteredRef.current = true;
          const first = data[0];
          mapRef.current.setView([first.latitude, first.longitude], 14);
        }
      }
    };
    
    fetchReports();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updated = payload.new as any;
        if (updated && updated.report_id) {
          setReports(prev => {
            const next = prev.map(r => r.report_id === updated.report_id ? { ...r, ...updated } : r);
            reportsRef.current = next;
            return next;
          });
          if (updated.status === 'triaged' || updated.status === 'failed_analysis') {
            fetchVisionResult(updated.report_id);
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_results' }, (payload) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newRecord = payload.new as any;
        if (newRecord && newRecord.agent_type === 'vision_triage') {
          setSelectedReportId(currentId => {
            if (currentId === newRecord.report_id) {
              setVisionResult(newRecord.result_json);
            }
            return currentId;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVisionResult]);

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
          
          <CommandClusteredMarkers
            reports={filteredReports}
            selectedReportId={selectedReportId}
            setSelectedReportId={setSelectedReportId}
            markerRefs={markerRefs}
            getMarkerIcon={getMarkerIcon}
          />

          {/* Permanent Operations Base / Depot Reference Marker (Always visible on map) */}
          <Marker
            position={[routeOrigin.lat, routeOrigin.lng]}
            icon={createDepotMarkerIcon({
              isCustom: routeOrigin.id.includes('custom'),
              tag: routeOrigin.id.includes('custom') ? 'CUSTOM DEPOT' : 'HQ DEPOT'
            })}
            zIndexOffset={1500}
          >
            <Popup className="custom-popup" closeButton={false}>
              <div className="bg-surface/95 backdrop-blur-md border border-border-subtle p-3 rounded-sm shadow-xl text-xs font-sans min-w-[210px]">
                <div className="font-mono font-bold text-emerald-400 uppercase text-[10px] tracking-wider mb-1 flex items-center justify-between">
                  <span>Operations Base / Depot</span>
                  <span className="text-[9px] bg-emerald-500/20 px-1 py-0.5 rounded text-emerald-300">
                    {routeOrigin.id.includes('custom') ? 'CUSTOM BASE' : 'ACTIVE HQ'}
                  </span>
                </div>
                <div className="font-bold text-text-primary mb-0.5">{routeOrigin.name}</div>
                <div className="text-[11px] text-text-muted mb-1.5">{routeOrigin.address}</div>
                <div className="text-[9px] font-mono text-text-muted/70 mb-2">
                  GPS: {routeOrigin.lat.toFixed(4)}, {routeOrigin.lng.toFixed(4)}
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTempOrigin(routeOrigin);
                      setIsOriginModalOpen(true);
                    }}
                    className="flex-1 py-1 px-2 bg-surface hover:bg-surface-subtle text-text-primary border border-border-subtle hover:border-brand-primary rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
                  >
                    Change Base
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      generateCleaningRoute();
                    }}
                    className="flex-1 py-1 px-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
                  >
                    {isRouteMode ? 'Recalculate Route' : 'Route From Here'}
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>

          {/* AI Optimized Dispatch Route Polyline Layers */}
          {isRouteMode && dispatchRoute && dispatchRoute.geometry.length > 0 && (
            <>
              {/* Outer Cyan Glow Path */}
              <Polyline
                positions={dispatchRoute.geometry}
                pathOptions={{
                  color: '#00F0FF',
                  weight: 7,
                  opacity: 0.45,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
              {/* Core Active Routing Line with Animated Dash */}
              <Polyline
                positions={dispatchRoute.geometry}
                pathOptions={{
                  color: '#0284C7',
                  weight: 3.5,
                  opacity: 0.95,
                  dashArray: '10, 6',
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />

              {/* Numbered Waypoint Badges along the Optimized Cleaning Route */}
              {dispatchRoute.orderedStops.map((stop, idx) => (
                <Marker
                  key={`stop-badge-${stop.report_id}`}
                  position={[Number(stop.latitude), Number(stop.longitude)]}
                  icon={createStopMarkerIcon(idx + 1, stop.priority_score || 0)}
                  zIndexOffset={2000 + idx * 10}
                  eventHandlers={{
                    click: () => {
                      setSelectedReportId(stop.report_id);
                    }
                  }}
                >
                  <Popup className="custom-popup" closeButton={false}>
                    <div className="bg-surface/95 backdrop-blur-md border border-border-subtle p-3 rounded-sm shadow-xl text-xs font-sans w-52">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-brand-primary uppercase text-[10px]">
                          Route Stop #{idx + 1}
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-red-500/20 text-red-400 border border-red-500/30">
                          Priority {stop.priority_score || 0}
                        </span>
                      </div>
                      <div className="font-mono font-bold text-text-primary text-xs mb-1">
                        {stop.tracking_reference}
                      </div>
                      <p className="text-[11px] text-text-secondary leading-snug line-clamp-2 mb-2">
                        {stop.citizen_notes || "Reported canal blockage scheduled for priority clearing."}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedReportId(stop.report_id)}
                        className="w-full py-1 bg-brand-primary hover:bg-brand-secondary text-white hover:text-black font-mono font-bold uppercase text-[10px] tracking-wider rounded-sm transition-colors text-center cursor-pointer"
                      >
                        Inspect Case
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          )}
        </MapContainer>
      </div>

      {/* Floating AI Route HUD Overlay Bar */}
      {isRouteMode && dispatchRoute && (
        <div className="absolute top-18 sm:top-20 left-1/2 -translate-x-1/2 z-[400] max-w-[94%] sm:max-w-2xl w-full pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-surface/95 backdrop-blur-2xl border-2 border-brand-primary/60 rounded-sm shadow-2xl p-3 sm:p-3.5 -skew-x-[3deg] flex flex-col gap-2">
            <div className="skew-x-[3deg] flex items-center justify-between gap-3">
              {/* Left: Branding & Status */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-brand-primary truncate flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-brand-primary" />
                    <span>esteRoute AI Dispatch Optimizer</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold text-text-primary">
                    {dispatchRoute.orderedStops.length} Clogged Canal Stops • {dispatchRoute.totalDistanceKm} km • ~{dispatchRoute.totalDurationMin} mins
                  </span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Google Maps Turn-by-Turn Link */}
                <a
                  href={dispatchRoute.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary hover:bg-brand-secondary text-white hover:text-black rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Open multi-stop driving directions in Google Maps"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Navigate in Google Maps</span>
                  <span className="sm:hidden">Maps</span>
                </a>

                {/* Close / Exit Route Mode */}
                <button
                  type="button"
                  onClick={() => setIsRouteMode(false)}
                  className="p-1.5 bg-surface-subtle hover:bg-surface border border-border-subtle hover:border-border-strong rounded-sm text-text-muted hover:text-text-primary transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Exit Route Mode"
                  aria-label="Exit Route Mode"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stop Sequence Pills Strip */}
            <div className="skew-x-[3deg] flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 border-t border-border-subtle/60 text-[10px] font-mono custom-scrollbar">
              <span className="px-1.5 py-0.5 rounded-xs bg-emerald-500/20 text-emerald-400 font-bold shrink-0 border border-emerald-500/30">
                HQ Depot
              </span>
              <ArrowRight className="w-3 h-3 text-text-muted shrink-0" />
              {dispatchRoute.orderedStops.map((stop, idx) => (
                <button
                  key={stop.report_id}
                  type="button"
                  onClick={() => {
                    setSelectedReportId(stop.report_id);
                  }}
                  className={twMerge(
                    "px-2 py-0.5 rounded-xs font-bold shrink-0 border transition-all cursor-pointer flex items-center gap-1",
                    selectedReportId === stop.report_id
                      ? "bg-brand-primary text-white border-brand-primary shadow-xs"
                      : "bg-surface-subtle text-text-secondary hover:text-text-primary border-border-subtle hover:border-brand-primary/50"
                  )}
                  title={`Stop #${idx + 1}: ${stop.tracking_reference} (Priority ${stop.priority_score})`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-brand-primary/30 text-[9px] flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span>{stop.tracking_reference.replace('ER-2026-', '')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
        
        {/* Map Controls - Bottom Left (Matches AI Vision panel width w-[24rem]) */}
        <div className={`pointer-events-auto absolute bottom-4 left-4 z-30 w-[24rem] flex items-center justify-between bg-surface/95 backdrop-blur-xl border border-border-subtle p-1.5 rounded-sm shadow-2xl transition-all duration-500 ${isControlsOpen ? 'translate-x-0 opacity-100' : '-translate-x-[calc(100%+2rem)] opacity-0 pointer-events-none'}`}>
          <div className="flex items-center gap-1 sm:gap-1.5">
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

            <div className="w-px h-6 bg-border-subtle my-auto mx-0.5" />

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
              onClick={toggleFocusMode}
              className={`p-2 sm:p-2.5 backdrop-blur-md border rounded-sm transition-all shadow-md active:scale-95 -skew-x-6 cursor-pointer flex items-center justify-center ${
                isFocusMode 
                  ? 'bg-brand-primary text-white border-brand-primary' 
                  : 'bg-surface/90 border-border-subtle text-text-primary hover:bg-brand-primary hover:text-white'
              }`}
              title={isFocusMode ? "Exit Focus Mode" : "Focus Mode (Hide All Panels)"}
              aria-label="Toggle Focus Mode"
            >
              {isFocusMode ? <Minimize2 className="w-4 h-4 skew-x-6" /> : <Maximize2 className="w-4 h-4 skew-x-6" />}
            </button>

            {/* AI Dispatch Route Generator Toggle */}
            <button
              type="button"
              onClick={() => generateCleaningRoute()}
              disabled={isGeneratingRoute}
              className={`p-2 sm:p-2.5 backdrop-blur-md border rounded-sm transition-all shadow-md active:scale-95 -skew-x-6 cursor-pointer flex items-center justify-center gap-1.5 ${
                isRouteMode
                  ? 'bg-brand-primary text-white border-brand-primary shadow-brand-primary/40 shadow-lg'
                  : 'bg-surface/90 border-border-subtle text-brand-primary hover:bg-brand-primary hover:text-white'
              }`}
              title={isRouteMode ? "Turn Off AI Route Mode" : "Generate Optimized AI Dispatch Route"}
              aria-label="Toggle Dispatch Route"
            >
              <Route className={twMerge("w-4 h-4 skew-x-6", isGeneratingRoute && "animate-spin")} />
            </button>
          </div>

          <div className="w-px h-6 bg-border-subtle my-auto mx-0.5" />

          <div className="flex items-center gap-1 sm:gap-1.5">
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

            <div className="w-px h-6 bg-border-subtle my-auto mx-0.5" />

            {/* Hide controls dock to the left button */}
            <button
              type="button"
              onClick={() => setIsControlsOpen(false)}
              className="p-2 sm:p-2.5 bg-surface/90 backdrop-blur-md border border-border-subtle rounded-sm text-text-muted hover:text-brand-primary transition-all shadow-md active:scale-95 -skew-x-6 cursor-pointer flex items-center justify-center"
              title="Hide Map Controls"
              aria-label="Hide Map Controls"
            >
              <ChevronLeft className="w-4 h-4 skew-x-6" />
            </button>
          </div>
        </div>

        {/* Reveal Map Controls Button when Minimized (Only rendered on the screen's left edge when AI Vision is closed) */}
        {!isControlsOpen && !isAnalysisOpen && (
          <button
            type="button"
            onClick={() => {
              setIsControlsOpen(true);
            }}
            className="pointer-events-auto absolute left-0 bottom-4 z-30 flex h-[46px] w-10 sm:w-12 items-center justify-center border border-l-0 border-border-subtle bg-surface/90 text-text-primary shadow-lg backdrop-blur-md transition-colors hover:text-brand-primary rounded-r-sm cursor-pointer"
            title="Show Map Controls"
            aria-label="Show Map Controls"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Bottom Center KPI Strip (Floating cards without outer container box) */}
        <div 
          className={`pointer-events-auto absolute bottom-4 left-1/2 z-30 -translate-x-1/2 transition-all duration-500 ease-out ${
            isKpiOpen 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-24 opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            {kpiMetrics.map((metric) => {
              const isSelected = statusFilter === metric.filter;
              return (
                <button
                  key={metric.label}
                  type="button"
                  onClick={() => setStatusFilter(prev => prev === metric.filter ? 'all' : metric.filter)}
                  className={twMerge(
                    "group relative overflow-hidden flex h-11 sm:h-13 min-w-[70px] sm:min-w-[96px] md:min-w-[114px] items-center border bg-surface/85 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-brand-primary -skew-x-2 sm:-skew-x-6 cursor-pointer text-left active:opacity-90 rounded-sm",
                    metric.border,
                    isSelected 
                      ? "ring-1 sm:ring-2 ring-brand-primary opacity-100 z-10 bg-surface/95 shadow-md shadow-brand-primary/20" 
                      : "opacity-90 hover:opacity-100"
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

            {/* Collapse down arrow for KPI */}
            <button 
              type="button"
              onClick={() => setIsKpiOpen(false)}
              className="h-11 sm:h-13 px-2 sm:px-2.5 bg-surface/85 hover:bg-surface border border-border-subtle text-text-muted hover:text-brand-primary rounded-sm transition-all shadow-lg backdrop-blur-md active:scale-95 -skew-x-2 sm:-skew-x-6 cursor-pointer flex items-center justify-center"
              title="Hide KPI Bar"
              aria-label="Hide KPI Bar"
            >
              <ChevronDown className="w-5 h-5 skew-x-2 sm:skew-x-6" />
            </button>
          </div>
        </div>

        {/* Reveal KPI Strip Button when Minimized */}
        {!isKpiOpen && (
          <button
            type="button"
            onClick={() => {
              setIsKpiOpen(true);
              setIsFocusMode(false);
            }}
            className="pointer-events-auto absolute bottom-0 left-1/2 -translate-x-1/2 z-30 flex h-7 sm:h-8 px-5 items-center justify-center border border-b-0 border-border-subtle bg-surface/90 text-text-primary shadow-lg backdrop-blur-md transition-colors hover:text-brand-primary rounded-t-sm cursor-pointer"
            title="Show KPI Metrics"
            aria-label="Show KPI Metrics"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}

        {/* Left Panel: AI Vision Analysis (Auto-adjusts above bottom-left controls dock) */}
        <div 
          className={`pointer-events-auto absolute left-4 top-[5rem] ${isControlsOpen ? 'bottom-[4.75rem]' : 'bottom-4'} w-[24rem] z-20 transition-all duration-500 ease-out ${
            isAnalysisOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'
          }`}
        >
          <div className="w-full h-full bg-surface/95 backdrop-blur-xl border border-border-subtle shadow-2xl flex flex-col rounded-sm relative overflow-hidden group">
            <BorderBeam delay={0} color="#60A5FA" />
            <div className="px-4 py-3 border-b border-border-subtle bg-surface-subtle flex justify-between items-center rounded-t-sm relative z-20">
              <h2 className="font-heading font-black text-sm tracking-widest uppercase flex items-center gap-2 text-brand-primary">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                </span>
                AI Vision Rationale
              </h2>
              <button 
                type="button"
                onClick={() => setIsAnalysisOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-sm bg-surface/80 hover:bg-surface border border-border-subtle hover:border-brand-primary text-text-muted hover:text-brand-primary transition-all cursor-pointer shadow-sm active:scale-95"
                title="Collapse AI Vision Rationale"
                aria-label="Collapse AI Vision Rationale"
              >
                <ChevronLeft className="w-5 h-5" />
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
                  <div className="w-full h-48 rounded-sm bg-border-subtle overflow-hidden relative group border border-border-subtle shadow-inner">
                    <img src={selectedReport.image_url} alt="Reported issue" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      <span className="bg-black/50 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded">Vision Source</span>
                    </div>
                  </div>

                  {/* Anti-Spoofing: Non-Waterway Warning Banner */}
                  {(visionResult?.is_valid_waterway === false || (selectedReport.status === 'failed_analysis' && visionResult?.rejection_reason)) && (
                    <div className="bg-amber-500/10 border-2 border-amber-500/50 p-3 rounded-sm text-amber-500 flex flex-col gap-1.5 shadow-md">
                      <div className="flex items-center gap-1.5 font-heading font-black text-xs uppercase tracking-wider text-amber-500">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
                        <span>Non-Waterway Image Detected (Quarantined)</span>
                      </div>
                      <p className="text-[11px] font-sans text-text-primary leading-relaxed">
                        AI verified this image does not depict an outdoor canal, estero, or drainage channel (Reason: <span className="font-mono font-bold text-amber-500 uppercase">{visionResult?.rejection_reason || 'non_waterway'}</span>).
                      </p>
                      <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-xs w-fit">
                        ✓ Automatically quarantined from Public Map pins
                      </div>
                    </div>
                  )}
                  
                  {/* AI Scores & Details */}
                  <div className="flex gap-3">
                    <div className="flex-1 bg-surface-subtle p-3 rounded-sm border border-border-subtle shadow-sm transform -skew-x-[6deg]">
                       <div className="transform skew-x-[6deg]">
                         <div className="text-[9px] uppercase font-bold text-text-muted mb-1 tracking-widest flex items-center justify-between">
                           <span>Priority Severity</span>
                           {selectedReport.status === 'triaged' && selectedReport.priority_score !== undefined && (
                             <span className={twMerge(
                               "text-[8px] font-mono font-bold uppercase px-1 py-0.2 rounded-xs",
                               selectedReport.priority_score >= 80 ? "bg-red-500/20 text-red-400" :
                               selectedReport.priority_score >= 60 ? "bg-amber-500/20 text-amber-400" :
                               "bg-emerald-500/20 text-emerald-400"
                             )}>
                               {selectedReport.priority_score >= 80 ? 'Urgent' : selectedReport.priority_score >= 60 ? 'High' : selectedReport.priority_score >= 30 ? 'Medium' : 'Low'}
                             </span>
                           )}
                         </div>
                         <div className="text-2xl font-black text-semantic-warning leading-none">
                           {selectedReport.status === 'pending_analysis' ? (
                             <span className="text-sm font-mono text-brand-primary animate-pulse flex items-center gap-1">
                               <Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning...
                             </span>
                           ) : (
                             visionResult?.is_valid_waterway === false ? (
                              <span className="text-base font-mono text-red-500 font-bold">
                                0 <span className="text-xs text-red-400 font-sans uppercase">(REJECTED)</span>
                              </span>
                            ) : (
                              <>{selectedReport.priority_score ?? visionResult?.blockage_severity_score ?? 'N/A'}<span className="text-sm text-text-muted">/100</span></>
                            )
                           )}
                         </div>
                         {/* Minor Sub-Scores: Vision Blockage & Rain Risk */}
                         {selectedReport.status !== 'pending_analysis' && visionResult?.is_valid_waterway !== false && (
                           <div className="text-[9px] font-mono text-text-muted mt-2 pt-1.5 border-t border-border-subtle/60 flex items-center justify-between">
                             <span>Vision: <strong className="text-text-primary">{visionResult?.blockage_severity_score ?? '—'}%</strong></span>
                             <span className="text-border-subtle opacity-60">|</span>
                             <span>Rain: <strong className="text-blue-400">{weatherResult?.rain_probability_index !== undefined ? `${weatherResult.rain_probability_index}%` : '—'}</strong></span>
                           </div>
                         )}
                       </div>
                    </div>
                    <div className="flex-1 bg-surface-subtle p-3 rounded-sm border border-border-subtle shadow-sm transform -skew-x-[6deg]">
                       <div className="transform skew-x-[6deg]">
                         <div className="text-[9px] uppercase font-bold text-text-muted mb-1 tracking-widest">Detected Waste</div>
                         <div className="flex flex-wrap gap-1 mt-1.5">
                           {selectedReport.status === 'pending_analysis' ? (
                             <span className="text-[9px] text-brand-primary font-mono italic flex items-center gap-1 animate-pulse">
                               Detecting...
                             </span>
                           ) : (visionResult?.waste_categories || []).length > 0 ? (
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
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] uppercase font-bold text-brand-primary tracking-widest flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" /> AI Assessment
                      </div>
                      {selectedReport.status === 'failed_analysis' && (
                        <span className="text-[9px] font-mono text-amber-500 font-bold uppercase tracking-wider">
                          Analysis Failed
                        </span>
                      )}
                      {selectedReport.status === 'pending_analysis' && (
                        <span className="text-[9px] font-mono text-brand-primary font-bold uppercase tracking-wider flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Pipeline Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-primary leading-relaxed bg-surface p-4 border-l-2 border-brand-primary italic shadow-md">
                      {selectedReport.status === 'pending_analysis'
                        ? 'AI Triage in progress... Analyzing canal photo, waste categorization, and meteorological flood risk.'
                        : (selectedReport.status === 'failed_analysis' && !visionResult?.rationale)
                          ? 'Automated visual analysis failed due to timeout or low clarity. Click "Re-run AI Analysis" below to retry, or proceed with manual dispatch.'
                          : `"${visionResult?.rationale || 'Awaiting full AI visual analysis...'}"`
                      }
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

                  {/* Manual Triage Panel */}
                  {(isManualEditOpen || selectedReport.status === 'failed_analysis' || selectedReport.needs_human_review) && (
                    <div id="manual-triage-card" className="bg-surface border-2 border-brand-primary/40 rounded-sm p-4 flex flex-col gap-3 shadow-xl">
                      {/* Header - No icons, no pill, just "Manual Triage" */}
                      <div className="border-b border-border-subtle pb-2">
                        <h3 className="text-xs font-heading font-black uppercase tracking-wider text-text-primary">
                          Manual Triage
                        </h3>
                      </div>

                      {/* Live Weather Forecast Metric (Minimal 1-line, no icon) */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-text-muted py-1 border-b border-border-subtle/50">
                        <span>48h Rain Probability:</span>
                        <span className="font-bold text-blue-400">
                          {weatherResult?.rain_probability_index !== undefined ? `${weatherResult.rain_probability_index}%` : 'Scanning...'}
                        </span>
                      </div>

                      {/* Blockage Severity Slider */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold uppercase tracking-wider text-[10px] text-text-secondary">
                            Assessed Blockage Severity:
                          </span>
                          <span className={twMerge(
                            "font-mono font-black text-sm px-2 py-0.5 rounded-sm",
                            manualSeverity >= 80 ? "text-semantic-urgent bg-semantic-urgent/10 border border-semantic-urgent/30" :
                            manualSeverity >= 60 ? "text-semantic-warning bg-semantic-warning/10 border border-semantic-warning/30" :
                            manualSeverity >= 30 ? "text-amber-400 bg-amber-500/10 border border-amber-500/30" :
                            "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30"
                          )}>
                            {manualSeverity}%
                          </span>
                        </div>

                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          step="1"
                          value={manualSeverity}
                          onChange={(e) => setManualSeverity(Number(e.target.value))}
                          className="w-full accent-brand-primary cursor-pointer h-2 bg-surface-subtle rounded-sm"
                        />

                        {/* Severity Presets */}
                        <div className="grid grid-cols-4 gap-1 mt-1">
                          {[
                            { label: 'Clear 15%', val: 15 },
                            { label: 'Mod 45%', val: 45 },
                            { label: 'Heavy 75%', val: 75 },
                            { label: 'Full 95%', val: 95 }
                          ].map((preset) => (
                            <button
                              key={preset.val}
                              type="button"
                              onClick={() => setManualSeverity(preset.val)}
                              className={twMerge(
                                "py-1 text-[9px] font-mono uppercase font-bold rounded-xs border transition-all cursor-pointer active:scale-95 text-center -skew-x-[4deg]",
                                manualSeverity === preset.val
                                  ? "bg-brand-primary text-white border-brand-primary"
                                  : "bg-surface-subtle text-text-muted hover:text-text-primary border-border-subtle hover:border-border-strong"
                              )}
                            >
                              <span className="inline-block skew-x-[4deg]">{preset.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Waste Category Selection (No check icon) */}
                      <div className="flex flex-col gap-1.5">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-text-secondary">
                          Observed Waste Categories:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {['Plastic', 'Organic', 'Silt', 'Construction', 'Other'].map((cat) => {
                            const isSelected = manualWaste.includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setManualWaste(prev => prev.filter(c => c !== cat));
                                  } else {
                                    setManualWaste(prev => [...prev, cat]);
                                  }
                                }}
                                className={twMerge(
                                  "px-2.5 py-1 rounded-xs text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border -skew-x-[4deg] active:scale-95",
                                  isSelected
                                    ? "bg-brand-primary text-white border-brand-primary shadow-xs"
                                    : "bg-surface-subtle text-text-muted hover:text-text-primary border-border-subtle"
                                )}
                              >
                                <span className="inline-block skew-x-[4deg]">{cat}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Optional Dispatcher Observation Note */}
                      <div className="flex flex-col gap-1">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-text-secondary">
                          Dispatcher Audit Note (Optional):
                        </span>
                        <input
                          type="text"
                          value={manualRationale}
                          onChange={(e) => setManualRationale(e.target.value)}
                          placeholder="e.g. Verified 75% obstruction with heavy silt"
                          className="bg-surface-subtle border border-border-subtle rounded-sm px-2.5 py-1.5 text-xs text-text-primary focus:border-brand-primary outline-hidden placeholder:text-text-muted font-mono"
                        />
                      </div>

                      {/* Real-Time Priority Score Preview Formula (Minimal 1-line) */}
                      {(() => {
                        const rpi = weatherResult?.rain_probability_index ?? 0;
                        const projectedScore = Math.round(((0.60 * manualSeverity) + (0.40 * rpi)) * 100) / 100;
                        const priorityLabel = projectedScore < 30 ? "Low" : projectedScore < 60 ? "Medium" : projectedScore < 80 ? "High" : "Urgent";
                        return (
                          <div className="bg-surface-subtle border border-border-subtle px-3 py-2 rounded-sm flex items-center justify-between text-xs font-mono">
                            <span className="text-[10px] uppercase font-bold text-text-muted">
                              Synthesized Priority
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-text-muted">
                                ({(0.60 * manualSeverity).toFixed(1)} + {(0.40 * rpi).toFixed(1)})
                              </span>
                              <span className={twMerge(
                                "text-[10px] font-bold uppercase px-1.5 py-0.2 rounded-xs",
                                priorityLabel === 'Urgent' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                                priorityLabel === 'High' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                                priorityLabel === 'Medium' ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                                "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              )}>
                                {priorityLabel}
                              </span>
                              <span className="text-sm font-black text-brand-primary">
                                {projectedScore}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Submit / Confirm Button */}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleManualTriageSubmit}
                          disabled={isManualTriageSubmitting}
                          className="flex-1 bg-brand-primary hover:bg-brand-secondary text-white hover:text-black py-2.5 px-3 rounded-sm font-bold uppercase text-[11px] tracking-wider transition-all flex items-center justify-center cursor-pointer shadow-md active:scale-95 disabled:opacity-50 -skew-x-[6deg]"
                        >
                          <span className="inline-block skew-x-[6deg]">
                            {isManualTriageSubmitting ? 'Synthesizing...' : 'Confirm Manual Triage'}
                          </span>
                        </button>

                        {isManualEditOpen && selectedReport.status === 'triaged' && (
                          <button
                            type="button"
                            onClick={() => setIsManualEditOpen(false)}
                            className="px-3.5 py-2 bg-surface-subtle hover:bg-surface border border-border-subtle rounded-sm text-xs font-mono font-bold uppercase text-text-muted hover:text-text-primary transition-colors cursor-pointer -skew-x-[6deg] active:scale-95"
                          >
                            <span className="inline-block skew-x-[6deg]">Cancel</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dispatcher Actions */}
                  <div className="pt-3 border-t border-border-subtle mt-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase font-bold text-text-muted tracking-widest">Command Controls</span>
                      
                      <div className="flex items-center gap-2">
                        {/* Manual Triage Toggle Button (If already triaged and form closed) */}
                        {selectedReport.status === 'triaged' && !isManualEditOpen && (
                          <button
                            type="button"
                            onClick={() => setIsManualEditOpen(true)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-surface-subtle hover:bg-surface text-text-secondary hover:text-brand-primary border border-border-subtle text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-xs"
                            title="Manually adjust severity score & waste types with live weather recalculation"
                          >
                            <Edit3 className="w-3 h-3 text-brand-primary" />
                            <span>Adjust Triage</span>
                          </button>
                        )}

                        {/* Re-run AI Analysis Button (Hidden if already in cleanup or resolved) */}
                        {selectedReport.status !== 'resolved' && selectedReport.status !== 'in_progress' && (
                          <button
                            type="button"
                            onClick={() => handleReAssess(selectedReport.report_id)}
                            disabled={isReAssessing || selectedReport.status === 'pending_analysis'}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white border border-brand-primary/30 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                            title="Re-run Gemini Vision & Multi-Agent Triage Pipeline"
                          >
                            <RefreshCw className={twMerge("w-3 h-3", (isReAssessing || selectedReport.status === 'pending_analysis') && "animate-spin")} />
                            <span>{isReAssessing || selectedReport.status === 'pending_analysis' ? 'Analyzing...' : 'Re-run AI Analysis'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {selectedReport.status !== 'in_progress' && selectedReport.status !== 'resolved' && (
                        <button 
                          onClick={() => updateStatus(selectedReport.report_id, 'in_progress')}
                          className="flex-1 bg-brand-primary text-white text-[10px] font-black py-2.5 rounded-sm hover:bg-brand-secondary transition-colors uppercase tracking-widest transform -skew-x-[6deg] shadow-lg cursor-pointer hover:-translate-y-0.5"
                        >
                          <span className="transform skew-x-[6deg] flex items-center justify-center gap-2">
                            <span>Dispatch Field Crew</span>
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

            {/* Integrated Controls Drawer Toggle when Controls are Hidden */}
            {!isControlsOpen && (
              <button
                type="button"
                onClick={() => setIsControlsOpen(true)}
                className="w-full py-2.5 px-4 border-t border-border-subtle bg-surface-subtle hover:bg-surface flex items-center justify-between text-text-muted hover:text-brand-primary transition-all rounded-b-sm group cursor-pointer shadow-inner shrink-0"
                title="Show Map Controls"
              >
                <span className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider uppercase group-hover:text-brand-primary transition-colors">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-brand-primary" />
                  Show Map Controls
                </span>
                <ChevronUp className="w-4 h-4 text-text-muted group-hover:text-brand-primary group-hover:-translate-y-0.5 transition-all" />
              </button>
            )}
          </div>
        </div>
        
        {/* Toggle Left Panel when Minimized */}
        {!isAnalysisOpen && (
          <button
            onClick={() => {
              setIsAnalysisOpen(true);
              setIsFocusMode(false);
            }}
            className="pointer-events-auto absolute left-0 top-[5rem] z-30 flex h-[46px] w-10 sm:w-12 items-center justify-center border border-l-0 border-border-subtle bg-surface/90 text-text-primary shadow-lg backdrop-blur-md transition-colors hover:text-brand-primary rounded-r-sm cursor-pointer"
            title="Show AI Vision Rationale"
            aria-label="Show AI Vision Rationale"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Right Panel: Dispatch Queue (w-[24rem] to match AI Vision panel) */}
        <div 
          className={`pointer-events-auto absolute bottom-4 right-4 top-[5rem] w-[24rem] z-20 transition-transform duration-500 ease-out ${isQueueOpen ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'}`}
        >
          <div className="w-full h-full bg-surface/95 backdrop-blur-xl border border-border-subtle shadow-2xl flex flex-col rounded-sm relative overflow-hidden group">
            <BorderBeam delay={3} color="#3F72AF" />
            
            {/* Header */}
            <div className="px-4 py-3 border-b border-border-subtle bg-surface-subtle flex justify-between items-center rounded-t-sm relative z-20">
              <h2 className="font-heading font-black text-sm tracking-widest uppercase flex items-center gap-2">
                <Navigation className="w-4 h-4 text-brand-primary animate-pulse" />
                Live Dispatch Queue
              </h2>
              <button 
                type="button"
                onClick={() => setIsQueueOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-sm bg-surface/80 hover:bg-surface border border-border-subtle hover:border-brand-primary text-text-muted hover:text-brand-primary transition-all cursor-pointer shadow-sm active:scale-95"
                title="Collapse Live Dispatch Queue"
                aria-label="Collapse Live Dispatch Queue"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Reference Number Search & Newest/Oldest Sort Controls */}
            <div className="p-3 border-b border-border-subtle bg-surface/60 space-y-2 relative z-20">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-2.5 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ref # (e.g. ER-2026)..."
                  className="w-full bg-app-bg/80 border border-border-subtle focus:border-brand-primary text-text-primary text-xs pl-8 pr-8 py-1.5 rounded-sm outline-none transition-colors font-mono placeholder:text-text-muted/60"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 text-text-muted hover:text-text-primary cursor-pointer p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-text-muted">
                  Showing <span className="font-bold text-text-primary">{filteredReports.length}</span> of {reports.length}
                </span>

                <button
                  type="button"
                  onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                  className="flex items-center gap-1.5 px-2 py-0.5 bg-surface hover:bg-brand-primary/15 border border-border-subtle hover:border-brand-primary/40 rounded-xs text-text-secondary hover:text-brand-primary transition-all cursor-pointer font-bold uppercase tracking-wider"
                  title={`Sorted by ${sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}. Click to toggle.`}
                >
                  <ArrowUpDown className="w-3 h-3 text-brand-primary" />
                  <span>{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
                </button>
              </div>

              {/* AI Dispatch Route Generator Bar (Strictly 1 Line) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => generateCleaningRoute()}
                  disabled={isGeneratingRoute}
                  className={twMerge(
                    "flex-1 py-2 px-3 rounded-sm font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 border -skew-x-[3deg]",
                    isRouteMode
                      ? "bg-brand-primary text-white border-brand-primary shadow-brand-primary/25 shadow-md"
                      : "bg-brand-primary/10 hover:bg-brand-primary hover:text-white border-brand-primary/30 text-brand-primary"
                  )}
                  title={isRouteMode ? "Turn Off AI Route Mode" : `Generate Cleaning Route (Starting: ${routeOrigin.name})`}
                >
                  <Route className={twMerge("w-3.5 h-3.5 skew-x-[3deg]", isGeneratingRoute && "animate-spin")} />
                  <span className="skew-x-[3deg] truncate">
                    {isGeneratingRoute ? 'Calculating Road Route...' : isRouteMode ? 'Hide Dispatch Route' : 'Generate Cleaning Route'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTempOrigin(routeOrigin);
                    setIsOriginModalOpen(true);
                  }}
                  className="h-[33px] w-[33px] rounded-sm bg-surface hover:bg-surface-subtle border border-border-subtle hover:border-brand-primary text-text-secondary hover:text-brand-primary flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 -skew-x-[3deg]"
                  title={`Set Route Starting Origin (Current: ${routeOrigin.name})`}
                  aria-label="Set Route Starting Origin"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 skew-x-[3deg] text-brand-primary" />
                </button>
              </div>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {filteredReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center p-6 border border-dashed border-border-subtle rounded-sm bg-app-bg/40">
                  <CheckCircle className="w-8 h-8 text-text-muted mb-2 opacity-50" />
                  <p className="font-heading text-xs font-bold uppercase tracking-widest text-text-secondary">
                    {searchQuery ? 'No Matching Reports' : `No ${statusFilter !== 'all' ? statusFilter : ''} Reports`}
                  </p>
                  <p className="text-[11px] text-text-muted mt-1">
                    {searchQuery 
                      ? `No incidents found matching "${searchQuery}".` 
                      : statusFilter !== 'all' 
                        ? `No reports match the "${statusFilter}" filter.` 
                        : 'No reports available in queue.'}
                  </p>
                  {(searchQuery || statusFilter !== 'all') && (
                    <div className="flex items-center gap-3 mt-3">
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="text-[10px] font-bold text-brand-primary hover:underline uppercase tracking-wider cursor-pointer"
                        >
                          Clear Search
                        </button>
                      )}
                      {statusFilter !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setStatusFilter('all')}
                          className="text-[10px] font-bold text-brand-primary hover:underline uppercase tracking-wider cursor-pointer"
                        >
                          Clear Filter
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                filteredReports.map((report) => {
                  const isCritical = report.status === 'triaged' && report.priority_score >= 70;
                  const needsReview = report.status === 'failed_analysis' || report.needs_human_review;
                  const isPending = report.status === 'pending_analysis';
                  const isResolved = report.status === 'resolved';
                
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
                          : isPending
                            ? 'border-blue-500 bg-blue-500/10'
                            : isResolved
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-border-subtle bg-app-bg hover:border-brand-primary/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono font-bold tracking-wider text-text-muted">{report.tracking_reference}</span>
                      
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm ${
                        isCritical ? 'bg-semantic-urgent text-white' :
                        needsReview ? 'bg-semantic-warning text-white' :
                        isPending ? 'bg-blue-600 text-white' :
                        isResolved ? 'bg-emerald-600 text-white' :
                        'bg-surface-subtle text-text-secondary border border-border-subtle'
                      }`}>
                        {report.status === 'failed_analysis' ? 'NON-WATERWAY' : needsReview ? 'NEEDS REVIEW' : isPending ? 'PENDING' : report.status.replace('_', ' ')}
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
                      
                      {report.status === 'in_progress' ? (
                        <span className="text-[10px] font-black tracking-widest text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-xs font-mono uppercase">
                          DISPATCHED
                        </span>
                      ) : isCritical ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(report.report_id, 'in_progress');
                          }}
                          className="text-[10px] font-black tracking-widest text-white bg-semantic-urgent hover:bg-red-600 px-3.5 py-1.5 transform -skew-x-[12deg] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md hover:shadow-red-500/25"
                          title="Dispatch field cleanup crew to this incident"
                        >
                          <span className="inline-block transform skew-x-[12deg]">
                            DISPATCH
                          </span>
                        </button>
                      ) : isResolved ? (
                        <span className="text-[10px] font-black tracking-widest text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> RESOLVED
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReportId(report.report_id);
                          }}
                          className="text-[10px] font-black tracking-widest text-brand-primary hover:text-brand-secondary flex items-center gap-1 group cursor-pointer"
                        >
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
        {!isQueueOpen && (
          <button
            onClick={() => {
              setIsQueueOpen(true);
              setIsFocusMode(false);
            }}
            className="pointer-events-auto absolute right-0 top-[5rem] z-30 flex h-[46px] w-10 sm:w-12 items-center justify-center border border-r-0 border-border-subtle bg-surface/90 text-text-primary shadow-lg backdrop-blur-md transition-colors hover:text-brand-primary rounded-l-sm cursor-pointer"
            title="Show Live Dispatch Queue"
            aria-label="Show Live Dispatch Queue"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Starting Origin Location Configuration Modal (Portaled to document.body to ensure top z-index & unblocked click events) */}
        {isOriginModalOpen && createPortal(
          <div 
            className="fixed inset-0 z-[2000] pointer-events-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsOriginModalOpen(false);
            }}
          >
            <div 
              className="bg-surface border-2 border-border-strong rounded-sm shadow-2xl max-w-lg w-full max-h-[86vh] flex flex-col text-text-primary animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Unskewed, no MapPin, no X */}
              <div className="px-5 py-3.5 border-b border-border-subtle bg-surface-subtle shrink-0">
                <h3 className="font-heading font-black text-sm uppercase tracking-wider text-text-primary">
                  Set Route Starting Origin
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Select an LGU station or drop a custom pin on the map
                </p>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4">
                {/* Presets List */}
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mb-2">
                    Available LGU Stations & Presets
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ROUTE_ORIGIN_PRESETS.map((preset) => {
                      const isSelected = tempOrigin.id === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setTempOrigin(preset)}
                          className={twMerge(
                            "p-2.5 rounded-sm border transition-all cursor-pointer text-left flex flex-col justify-between group",
                            isSelected
                              ? "bg-brand-primary/15 border-brand-primary shadow-xs ring-1 ring-brand-primary/50"
                              : "bg-surface-subtle hover:bg-surface border-border-subtle hover:border-brand-primary/50"
                          )}
                        >
                          <div className="flex items-center justify-between gap-1.5 w-full">
                            <span className="font-bold text-xs text-text-primary group-hover:text-brand-primary transition-colors truncate">
                              {preset.name}
                            </span>
                            {isSelected && (
                              <span className="text-[8px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-text-muted truncate mt-1">
                            {preset.address}
                          </div>
                          <div className="text-[9px] font-mono text-text-muted/70 mt-0.5">
                            GPS: {preset.lat.toFixed(4)}, {preset.lng.toFixed(4)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Mini Map to drop or drag pin */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted">
                    <span>Interactive Origin Map</span>
                    <span className="text-brand-primary lowercase font-normal">click to drop pin or drag marker</span>
                  </div>

                  <div className="h-48 w-full rounded-sm border border-border-subtle overflow-hidden relative shadow-inner">
                    <MapContainer
                      center={[tempOrigin.lat, tempOrigin.lng]}
                      zoom={14}
                      className="w-full h-full"
                      zoomControl={false}
                      attributionControl={false}
                    >
                      <TileLayer url={getTileUrl(mapType)} />
                      <Marker
                        position={[tempOrigin.lat, tempOrigin.lng]}
                        icon={createDepotMarkerIcon({
                          isCustom: tempOrigin.id.includes('custom'),
                          tag: tempOrigin.id.includes('custom') ? 'CUSTOM DEPOT' : 'HQ DEPOT'
                        })}
                        draggable={true}
                        eventHandlers={{
                          dragend(e) {
                            const marker = e.target;
                            const pos = marker.getLatLng();
                            setTempOrigin({
                              id: 'custom-pin',
                              name: 'Custom Depot Pin',
                              address: `Custom Location (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`,
                              lat: pos.lat,
                              lng: pos.lng
                            });
                          }
                        }}
                      />
                      <OriginMapClickHandler
                        onSelect={(lat, lng) => {
                          setTempOrigin({
                            id: 'custom-pin',
                            name: 'Custom Depot Pin',
                            address: `Custom Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                            lat,
                            lng
                          });
                        }}
                      />
                      <OriginMapFlyTo center={[tempOrigin.lat, tempOrigin.lng]} />
                      <OriginMapResize />
                    </MapContainer>
                  </div>

                  <div className="p-2.5 bg-surface-subtle border border-border-subtle rounded-sm flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <span className="font-bold text-text-primary truncate block text-xs">
                        {tempOrigin.name}
                      </span>
                      <span className="text-[10px] text-text-muted truncate block">
                        {tempOrigin.address}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-brand-primary shrink-0 bg-brand-primary/10 px-2 py-0.5 rounded border border-brand-primary/20">
                      GPS: {tempOrigin.lat.toFixed(4)}, {tempOrigin.lng.toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer - Skewed buttons only */}
              <div className="px-5 py-3 border-t border-border-subtle bg-surface-subtle flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOriginModalOpen(false)}
                  className="px-4 py-1.5 bg-surface-subtle hover:bg-surface border border-border-subtle rounded-sm text-xs font-mono font-bold uppercase text-text-muted hover:text-text-primary transition-colors cursor-pointer -skew-x-[6deg] active:scale-95"
                >
                  <span className="inline-block skew-x-[6deg]">Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRouteOrigin(tempOrigin);
                    if (isRouteMode) {
                      generateCleaningRoute(tempOrigin);
                    }
                    setIsOriginModalOpen(false);
                  }}
                  className="px-4 py-1.5 bg-brand-primary hover:bg-brand-secondary text-white rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm -skew-x-[6deg] active:scale-95"
                >
                  <span className="inline-block skew-x-[6deg]">Set as Route Origin</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
        
      </div>
    </div>
  );
}
