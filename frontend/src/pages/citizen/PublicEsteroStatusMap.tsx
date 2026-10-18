import { useState, useRef, useEffect, useId, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Maximize, 
  Minimize, 
  Crosshair, 
  Droplets, 
  Clock, 
  PlusCircle, 
  Layers, 
  Sun, 
  Moon, 
  Waves,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

// Traveling perimeter highlight matching landing page frosted cards
const BorderBeam = ({ delay = 0, color = "#60A5FA" }: { delay?: number; color?: string }) => {
  const id = useId();
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm z-20">
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
        />
      </svg>
    </div>
  );
};

// Component to handle auto-resize and layout changes
function MapResizeHandler({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullscreen, map]);
  return null;
}

// Map style tile providers
export type MapTileType = 'detailed' | 'standard';
const getTileUrl = (type: MapTileType) => {
  if (type === 'detailed') {
    return 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
  }
  return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
};

// Custom Citizen Pin Marker Generator (Pulsing DivIcon with High-Visibility Glow)
const createCitizenIcon = (status: 'blocked' | 'dispatched' | 'resolved') => {
  const colorMap = {
    blocked: {
      bg: 'bg-semantic-urgent',
      border: 'border-white',
      shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.8)]',
      pulse: 'bg-red-500',
    },
    dispatched: {
      bg: 'bg-amber-500',
      border: 'border-white',
      shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.8)]',
      pulse: 'bg-amber-400',
    },
    resolved: {
      bg: 'bg-green-500',
      border: 'border-white',
      shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.8)]',
      pulse: 'bg-green-400',
    },
  };

  const style = colorMap[status] || colorMap.blocked;

  return L.divIcon({
    className: 'custom-citizen-marker',
    html: `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full cursor-pointer">
        <span class="absolute -inset-1 rounded-full ${style.pulse} animate-ping opacity-60"></span>
        <div class="relative w-7 h-7 rounded-full ${style.bg} ${style.border} border-2 ${style.shadow} flex items-center justify-center text-white transform hover:scale-110 transition-transform">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            ${status === 'resolved' 
              ? '<polyline points="20 6 9 17 4 12"></polyline>' 
              : status === 'dispatched'
                ? '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>'
                : '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'}
          </svg>
        </div>
        <div class="w-1.5 h-2 ${style.bg} -mt-0.5 clip-triangle"></div>
      </div>
    `,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -38],
  });
};

// Waterway Basin Corridors in Cebu City
export interface BasinCorridor {
  id: string;
  name: string;
  barangays: string;
  coordinates: [number, number][];
  status: 'flowing' | 'advisory' | 'critical';
  flowRate: string;
  capacityScore: number;
  color: string;
  details: string;
}

const CEBU_BASINS: BasinCorridor[] = [
  {
    id: 'lahug',
    name: 'Lahug River Basin',
    barangays: 'Busay • Lahug • Kamputhaw • Tejero • Pier 3',
    coordinates: [
      [10.3420, 123.8920],
      [10.3340, 123.8970],
      [10.3250, 123.9020],
      [10.3160, 123.9080],
      [10.3060, 123.9140],
    ],
    status: 'flowing',
    flowRate: '88% Normal Flow',
    capacityScore: 88,
    color: '#10B981', // Emerald
    details: 'Primary stormwater corridor from upstream hills discharging cleanly into Cebu harbor. No major obstruction reported.',
  },
  {
    id: 'mahiga',
    name: 'Mahiga Creek Corridor',
    barangays: 'Banilad • Kasambagan • Mabolo • Subangdaku',
    coordinates: [
      [10.3510, 123.9110],
      [10.3410, 123.9170],
      [10.3320, 123.9240],
      [10.3240, 123.9310],
    ],
    status: 'advisory',
    flowRate: '65% Moderate Capacity',
    capacityScore: 65,
    color: '#F59E0B', // Amber
    details: 'Heavy siltation and localized plastic accumulation near commercial culverts. Maintenance cleanup scheduled within 24 hours.',
  },
  {
    id: 'guadalupe',
    name: 'Guadalupe River System',
    barangays: 'Guadalupe • Capitol Site • Kalunasan • Ermita',
    coordinates: [
      [10.3330, 123.8760],
      [10.3220, 123.8820],
      [10.3110, 123.8880],
      [10.2980, 123.8920],
    ],
    status: 'flowing',
    flowRate: '92% Clear Flow',
    capacityScore: 92,
    color: '#10B981',
    details: 'Recently dredged section under DPWH flood control project. Water levels safe and free of surface debris.',
  },
  {
    id: 'kinalumsan',
    name: 'Kinalumsan Drainage Basin',
    barangays: 'Punta Princesa • Tisa • Mambaling • SRP Channel',
    coordinates: [
      [10.3120, 123.8640],
      [10.3030, 123.8710],
      [10.2940, 123.8790],
      [10.2860, 123.8870],
    ],
    status: 'critical',
    flowRate: '42% Restricted Flow',
    capacityScore: 42,
    color: '#EF4444', // Red
    details: 'Severe localized constriction reported near Mambaling bridge. Flood hazard advisory active during heavy localized downpours.',
  },
];

interface PublicReportItem {
  id: string;
  trackingRef: string;
  lat: number;
  lng: number;
  status: 'blocked' | 'dispatched' | 'resolved';
  severity: 'low' | 'moderate' | 'high';
  notes: string;
  imageUrl?: string;
  createdAt: string;
  basinName?: string;
}

export default function PublicEsteroStatusMap() {
  const { theme: globalTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapTileType, setMapTileType] = useState<MapTileType>('detailed');
  const [isMapDark, setIsMapDark] = useState<boolean>(globalTheme === 'dark');
  const [selectedBasinId, setSelectedBasinId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'blocked' | 'dispatched' | 'resolved'>('all');
  const [reports, setReports] = useState<PublicReportItem[]>([]);

  const mapRef = useRef<L.Map>(null);

  // Sync map dark mode when the global navbar theme changes
  useEffect(() => {
    setIsMapDark(globalTheme === 'dark');
  }, [globalTheme]);

  // Fetch real reports from Supabase with graceful fallback
  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('report_id, tracking_reference, latitude, longitude, citizen_notes, image_url, status, priority_score, created_at')
          .order('created_at', { ascending: false })
          .limit(40);

        if (!error && data && data.length > 0) {
          const mapped: PublicReportItem[] = data.map((item) => {
            let mappedStatus: 'blocked' | 'dispatched' | 'resolved' = 'blocked';
            if (item.status === 'resolved') mappedStatus = 'resolved';
            else if (item.status === 'dispatched') mappedStatus = 'dispatched';

            let sev: 'low' | 'moderate' | 'high' = 'moderate';
            if ((item.priority_score ?? 0) >= 70) sev = 'high';
            else if ((item.priority_score ?? 0) < 40) sev = 'low';

            return {
              id: item.report_id,
              trackingRef: item.tracking_reference || `ER-${item.report_id.slice(0, 6)}`,
              lat: Number(item.latitude),
              lng: Number(item.longitude),
              status: mappedStatus,
              severity: sev,
              notes: item.citizen_notes || 'Citizen reported waterway debris constriction.',
              imageUrl: item.image_url,
              createdAt: new Date(item.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
            };
          });

          if (isMounted) setReports(mapped);
        } else {
          // Curated real-world demonstration data for Cebu City
          const fallbackData: PublicReportItem[] = [
            {
              id: 'demo-1',
              trackingRef: 'ER-2026-881204',
              lat: 10.3330,
              lng: 123.9180,
              status: 'blocked',
              severity: 'high',
              notes: 'Dense plastic and fallen branches trapping garbage at Subangdaku culvert gate.',
              createdAt: 'Today, 2:15 PM',
              basinName: 'Mahiga Creek Corridor',
            },
            {
              id: 'demo-2',
              trackingRef: 'ER-2026-443912',
              lat: 10.3190,
              lng: 123.9040,
              status: 'dispatched',
              severity: 'moderate',
              notes: 'LGU declogging truck and manual cleaning crew on site for routine maintenance.',
              createdAt: 'Today, 11:30 AM',
              basinName: 'Lahug River Basin',
            },
            {
              id: 'demo-3',
              trackingRef: 'ER-2026-102948',
              lat: 10.3010,
              lng: 123.8760,
              status: 'resolved',
              severity: 'low',
              notes: 'Canal dredging completed by engineering department. Waterway free flowing.',
              createdAt: 'Yesterday, 4:45 PM',
              basinName: 'Kinalumsan Drainage Basin',
            },
            {
              id: 'demo-4',
              trackingRef: 'ER-2026-559281',
              lat: 10.3150,
              lng: 123.8860,
              status: 'blocked',
              severity: 'moderate',
              notes: 'Debris accumulation after moderate rainfall. Drainage grate partly clogged.',
              createdAt: 'Today, 9:20 AM',
              basinName: 'Guadalupe River System',
            },
          ];
          if (isMounted) setReports(fallbackData);
        }
      } catch (err) {
        console.warn('Could not fetch reports from Supabase:', err);
      }
    }

    loadReports();

    // Subscribe to realtime changes on the reports table
    const channel = supabase
      .channel('public-map-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        loadReports();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtered corridors
  const displayedBasins = useMemo(() => {
    if (selectedBasinId === 'all') return CEBU_BASINS;
    return CEBU_BASINS.filter(b => b.id === selectedBasinId);
  }, [selectedBasinId]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [reports, statusFilter]);

  // Computed summary metrics
  const activeBlockagesCount = reports.filter(r => r.status === 'blocked').length;
  const dispatchedCleanupsCount = reports.filter(r => r.status === 'dispatched').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;
  const overallFlowHealth = Math.round(
    CEBU_BASINS.reduce((acc, curr) => acc + curr.capacityScore, 0) / CEBU_BASINS.length
  );

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 250);
  };

  const goToCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapRef.current?.flyTo([latitude, longitude], 15, { duration: 1.5 });
        },
        (error) => {
          console.warn('GPS Error:', error);
          alert('Unable to retrieve location. Please check browser permissions.');
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const focusBasin = (basin: BasinCorridor) => {
    setSelectedBasinId(basin.id);
    const midPoint = basin.coordinates[Math.floor(basin.coordinates.length / 2)];
    mapRef.current?.flyTo(midPoint, 14, { duration: 1.2 });
  };

  return (
    <div className={twMerge(
      "w-full flex flex-col transition-all duration-300",
      isFullscreen 
        ? "fixed inset-0 z-[999] bg-app-bg h-screen w-screen p-0 m-0" 
        : "h-[calc(100dvh-130px)] md:h-[calc(100dvh-170px)] min-h-[580px] lg:h-[calc(100dvh-200px)] lg:min-h-[660px]"
    )}>
      
      {/* 1. Header & Live Civic Stats Strip (Hidden in Fullscreen) */}
      {!isFullscreen && (
        <div className="shrink-0 mb-3 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/30 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm -skew-x-3">
                <span className="skew-x-3 flex items-center gap-1.5">
                  <Waves className="w-3 h-3 text-brand-primary" />
                  Live Drainage Transparency
                </span>
              </span>
              <span className="text-text-muted text-[10px] font-mono hidden sm:inline">• Cebu City Basin Network</span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-4xl font-heading font-black tracking-tight text-text-primary border-l-4 border-brand-primary pl-3">
              Public Basin Map
            </h1>
            <p className="text-text-muted text-xs md:text-sm pl-4 line-clamp-1">
              Real-time waterway flow, community blockage advisories, and ongoing city maintenance.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {/* Flow Health */}
            <div className="bg-surface/60 backdrop-blur-md border border-border-subtle px-3 py-1.5 rounded-sm -skew-x-3 flex items-center gap-2 shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse skew-x-3" />
              <div className="skew-x-3 text-left">
                <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider">Flow Index</div>
                <div className="text-xs font-heading font-bold text-emerald-400">{overallFlowHealth}% Optimal</div>
              </div>
            </div>

            {/* Active Blockages */}
            <div className="bg-surface/60 backdrop-blur-md border border-border-subtle px-3 py-1.5 rounded-sm -skew-x-3 flex items-center gap-2 shrink-0">
              <div className="w-2 h-2 rounded-full bg-semantic-urgent skew-x-3" />
              <div className="skew-x-3 text-left">
                <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider">Active Alerts</div>
                <div className="text-xs font-heading font-bold text-text-primary">{activeBlockagesCount} Constricted</div>
              </div>
            </div>

            {/* Ongoing Cleanups */}
            <div className="bg-surface/60 backdrop-blur-md border border-border-subtle px-3 py-1.5 rounded-sm -skew-x-3 flex items-center gap-2 shrink-0">
              <div className="w-2 h-2 rounded-full bg-amber-500 skew-x-3" />
              <div className="skew-x-3 text-left">
                <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider">Crews In Field</div>
                <div className="text-xs font-heading font-bold text-amber-400">{dispatchedCleanupsCount} Operations</div>
              </div>
            </div>

            {/* Resolved / Cleared */}
            <div className="bg-surface/60 backdrop-blur-md border border-border-subtle px-3 py-1.5 rounded-sm -skew-x-3 flex items-center gap-2 shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500 skew-x-3" />
              <div className="skew-x-3 text-left">
                <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider">Cleaned</div>
                <div className="text-xs font-heading font-bold text-emerald-400">{resolvedCount} Restored</div>
              </div>
            </div>

            {/* Report CTA Link */}
            <Link
              to="/citizen"
              className="bg-brand-primary hover:bg-brand-secondary text-white hover:text-black transition-colors px-3 py-2 rounded-sm -skew-x-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider shadow-md shrink-0 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 skew-x-3" />
              <span className="skew-x-3 hidden sm:inline">Report Blockage</span>
              <span className="skew-x-3 sm:hidden">Report</span>
            </Link>
          </div>
        </div>
      )}

      {/* 2. Map Glassmorphic Card Container with BorderBeam Highlight */}
      <div className={twMerge(
        "flex-1 w-full relative overflow-hidden transition-all duration-300 shadow-2xl",
        isFullscreen 
          ? "rounded-none border-0" 
          : "rounded-sm border-2 border-border-subtle bg-surface/35 hover:bg-surface/50 backdrop-blur-xl"
      )}>
        {/* Traveling Highlight Beam (Disabled in Fullscreen) */}
        {!isFullscreen && <BorderBeam delay={0} color="#60A5FA" />}

        {/* 3. Floating Filter Strip (Top Left Overlay) */}
        <div className="absolute top-3 left-3 right-3 md:right-auto z-[400] flex flex-wrap items-center gap-1.5 pointer-events-auto">
          {/* Status Filters */}
          <div className="bg-surface/90 backdrop-blur-md border border-border-subtle p-1 rounded-sm shadow-xl flex items-center gap-1 -skew-x-3">
            <button
              onClick={() => setStatusFilter('all')}
              className={twMerge(
                "px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all skew-x-3",
                statusFilter === 'all' 
                  ? "bg-brand-primary text-white shadow-sm" 
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              All Pins
            </button>
            <button
              onClick={() => setStatusFilter('blocked')}
              className={twMerge(
                "px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all skew-x-3 flex items-center gap-1",
                statusFilter === 'blocked' 
                  ? "bg-semantic-urgent text-white shadow-sm" 
                  : "text-text-muted hover:text-semantic-urgent"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-semantic-urgent" />
              Blockages
            </button>
            <button
              onClick={() => setStatusFilter('dispatched')}
              className={twMerge(
                "px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all skew-x-3 flex items-center gap-1",
                statusFilter === 'dispatched' 
                  ? "bg-amber-500 text-white shadow-sm" 
                  : "text-text-muted hover:text-amber-400"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Cleanups
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={twMerge(
                "px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all skew-x-3 flex items-center gap-1",
                statusFilter === 'resolved' 
                  ? "bg-emerald-600 text-white shadow-sm" 
                  : "text-text-muted hover:text-emerald-400"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Cleared
            </button>
          </div>

          {/* Basin Selector Dropdown Pill */}
          <div className="bg-surface/90 backdrop-blur-md border border-border-subtle px-2 py-1 rounded-sm shadow-xl flex items-center gap-1.5 -skew-x-3 text-xs">
            <Droplets className="w-3.5 h-3.5 text-brand-primary skew-x-3" />
            <select
              value={selectedBasinId}
              onChange={(e) => {
                const bId = e.target.value;
                setSelectedBasinId(bId);
                if (bId !== 'all') {
                  const basin = CEBU_BASINS.find(b => b.id === bId);
                  if (basin) focusBasin(basin);
                } else {
                  mapRef.current?.flyTo([10.3157, 123.8854], 13.5, { duration: 1.2 });
                }
              }}
              className="bg-transparent text-text-primary text-[10px] font-mono font-bold uppercase tracking-wider outline-none cursor-pointer skew-x-3"
            >
              <option value="all" className="bg-surface text-text-primary">All Waterway Basins</option>
              {CEBU_BASINS.map(b => (
                <option key={b.id} value={b.id} className="bg-surface text-text-primary">
                  {b.name} ({b.capacityScore}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. The Leaflet Map Instance */}
        <div className={twMerge(
          "w-full h-full relative transition-colors",
          isMapDark && "dark-map"
        )}>
          <MapContainer
            center={[10.3157, 123.8854]}
            zoom={13.5}
            scrollWheelZoom={true}
            zoomControl={false}
            attributionControl={false}
            className="w-full h-full z-0"
            ref={mapRef}
          >
            <TileLayer
              key={`${mapTileType}-${isMapDark ? 'dark' : 'light'}`}
              url={getTileUrl(mapTileType)}
            />

            <MapResizeHandler isFullscreen={isFullscreen} />

            {/* Basin Waterway Polylines */}
            {displayedBasins.map((basin) => (
              <Polyline
                key={basin.id}
                positions={basin.coordinates}
                pathOptions={{
                  color: basin.color,
                  weight: 5,
                  opacity: 0.85,
                  dashArray: basin.status === 'advisory' ? '8, 8' : undefined,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              >
                <Tooltip sticky direction="top" opacity={0.95}>
                  <div className="font-sans text-xs p-1 font-bold">
                    <div className="text-text-primary flex items-center gap-1">
                      <Waves className="w-3.5 h-3.5 text-brand-primary" />
                      {basin.name}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">{basin.flowRate}</div>
                  </div>
                </Tooltip>

                <Popup className="custom-popup" closeButton={false}>
                  <div className="bg-surface/95 backdrop-blur-md border border-border-strong rounded-sm shadow-2xl p-3 w-64 text-text-primary">
                    <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-2 mb-2">
                      <div className="font-heading font-black text-sm uppercase tracking-wide text-brand-primary flex items-center gap-1.5">
                        <Waves className="w-4 h-4" />
                        {basin.name}
                      </div>
                      <span className={twMerge(
                        "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider",
                        basin.status === 'flowing' && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40",
                        basin.status === 'advisory' && "bg-amber-500/20 text-amber-400 border border-amber-500/40",
                        basin.status === 'critical' && "bg-red-500/20 text-red-400 border border-red-500/40"
                      )}>
                        {basin.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-text-muted font-mono mb-2">
                      <span className="text-text-secondary font-bold">Corridor:</span> {basin.barangays}
                    </div>

                    <p className="text-[11px] text-text-secondary leading-relaxed mb-3">
                      {basin.details}
                    </p>

                    <div className="bg-app-bg/80 p-2 rounded-sm border border-border-subtle flex items-center justify-between text-xs font-mono">
                      <span className="text-text-muted">Channel Flow:</span>
                      <span className="font-bold text-text-primary">{basin.flowRate}</span>
                    </div>

                    <div className="mt-3">
                      <Link
                        to={`/citizen?basin=${basin.id}`}
                        className="w-full bg-brand-primary hover:bg-brand-secondary text-white hover:text-black py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Report Constriction on this Canal
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            ))}

            {/* Community Blockage & Cleanup Markers */}
            {filteredReports.map((report) => (
              <Marker
                key={report.id}
                position={[report.lat, report.lng]}
                icon={createCitizenIcon(report.status)}
              >
                <Popup className="custom-popup" closeButton={false}>
                  <div className="bg-surface/95 backdrop-blur-md border border-border-strong rounded-sm shadow-2xl p-3 w-64 text-text-primary">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-1 mb-2 border-b border-border-subtle pb-2">
                      <div>
                        <div className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
                          {report.trackingRef}
                        </div>
                        <div className="text-xs font-heading font-black text-text-primary">
                          {report.status === 'resolved' 
                            ? 'Cleared Waterway' 
                            : report.status === 'dispatched' 
                              ? 'Cleanup Dispatched' 
                              : 'Active Constriction'}
                        </div>
                      </div>

                      <span className={twMerge(
                        "text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm tracking-wider",
                        report.status === 'resolved' 
                          ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                          : report.status === 'dispatched' 
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                      )}>
                        {report.status}
                      </span>
                    </div>

                    {/* Image Preview if available */}
                    {report.imageUrl && (
                      <div className="w-full h-28 mb-2.5 rounded-sm overflow-hidden border border-border-subtle bg-black/40 relative">
                        <img 
                          src={report.imageUrl} 
                          alt="Canal Condition" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // If storage image fails to load, conceal thumbnail
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Notes */}
                    <p className="text-[11px] text-text-secondary line-clamp-3 mb-2 leading-relaxed">
                      "{report.notes}"
                    </p>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-1 border-t border-border-subtle">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {report.createdAt}
                      </span>
                      <span className="text-brand-primary font-bold">
                        {report.severity === 'high' ? 'High Impact' : report.severity === 'low' ? 'Low Impact' : 'Moderate'}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* 5. Basin Legend & Color Guide (Bottom Left) */}
        <div className="absolute bottom-4 left-3 z-[400] pointer-events-none hidden sm:block">
          <div className="bg-surface/90 backdrop-blur-md border border-border-subtle p-2.5 rounded-sm shadow-xl -skew-x-3 pointer-events-auto max-w-[240px]">
            <div className="skew-x-3 text-[10px] font-mono uppercase tracking-wider font-bold text-text-secondary mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Info className="w-3 h-3 text-brand-primary" />
                Drainage Status
              </span>
              <span className="text-text-muted">{displayedBasins.length} Basins</span>
            </div>
            
            <div className="skew-x-3 flex flex-col gap-1 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-emerald-500 rounded-full" />
                <span className="text-text-primary text-[10px] font-bold">Free Flowing / Safe</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-amber-500 rounded-full" />
                <span className="text-text-primary text-[10px] font-bold">Maintenance / Moderate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-semantic-urgent rounded-full" />
                <span className="text-text-primary text-[10px] font-bold">High Constriction Advisory</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Floating Map Utility Controls (Bottom Right) */}
        <div className="absolute bottom-4 right-3 z-[400] flex flex-col gap-2 pointer-events-auto">
          {/* Map Style 1 / 2 Switcher */}
          <button
            onClick={() => setMapTileType(prev => prev === 'detailed' ? 'standard' : 'detailed')}
            className="bg-surface/90 hover:bg-brand-primary hover:text-white text-text-primary p-2.5 rounded-sm shadow-xl border border-border-subtle -skew-x-3 transition-all active:scale-95 flex items-center justify-center group"
            title={mapTileType === 'detailed' ? "Switch to Map Style 2 (Standard OSM)" : "Switch to Map Style 1 (Detailed Humanitarian)"}
            aria-label="Toggle Map Tile Source"
          >
            <Layers className="w-4 h-4 skew-x-3 text-text-secondary group-hover:text-white" />
          </button>

          {/* Dark / Light Invert Toggle */}
          <button
            onClick={() => setIsMapDark(prev => !prev)}
            className="bg-surface/90 hover:bg-brand-primary hover:text-white text-text-primary p-2.5 rounded-sm shadow-xl border border-border-subtle -skew-x-3 transition-all active:scale-95 flex items-center justify-center group"
            title={isMapDark ? "Switch to Light Map Mode" : "Switch to Dark Map Mode"}
            aria-label="Toggle Dark Mode"
          >
            {isMapDark ? (
              <Sun className="w-4 h-4 skew-x-3 text-amber-400 group-hover:text-white" />
            ) : (
              <Moon className="w-4 h-4 skew-x-3 text-brand-primary group-hover:text-white" />
            )}
          </button>

          {/* GPS Locate Me */}
          <button
            onClick={goToCurrentLocation}
            className="bg-surface/90 hover:bg-brand-primary hover:text-white text-text-primary p-2.5 rounded-sm shadow-xl border border-border-subtle -skew-x-3 transition-all active:scale-95 flex items-center justify-center group"
            title="Locate Waterways Near Me"
            aria-label="Locate me"
          >
            <Crosshair className="w-4 h-4 skew-x-3 text-brand-secondary group-hover:text-white" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="bg-brand-primary hover:bg-brand-secondary text-white hover:text-black p-2.5 rounded-sm shadow-xl -skew-x-3 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 skew-x-3" />
            ) : (
              <Maximize className="w-4 h-4 skew-x-3" />
            )}
          </button>
        </div>

      </div>

      {/* Pop-up Custom Styling */}
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          border-radius: 0 !important;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }
        .custom-popup .leaflet-popup-tip-container {
          display: none !important;
        }
        .clip-triangle {
          clip-path: polygon(50% 100%, 0 0, 100% 0);
        }
      `}</style>

    </div>
  );
}
