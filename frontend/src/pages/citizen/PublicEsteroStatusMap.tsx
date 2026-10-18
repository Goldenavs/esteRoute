import { useState, useRef, useEffect, useId, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Maximize2, 
  Minimize2, 
  Crosshair, 
  Clock, 
  PlusCircle, 
  Layers, 
  Sun, 
  Moon, 
  Waves,
  Info,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const handleResize = () => {
      map.invalidateSize();
    };
    handleResize();
    const timer = setTimeout(handleResize, 150);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
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

// Custom Map Controls mirroring BlockageSubmissionForm styling
function CustomMapControls({
  isMapDark,
  setIsMapDark,
  mapType,
  setMapType,
  toggleFullScreen,
  isFullscreen,
}: {
  isMapDark: boolean;
  setIsMapDark: React.Dispatch<React.SetStateAction<boolean>>;
  mapType: MapTileType;
  setMapType: React.Dispatch<React.SetStateAction<MapTileType>>;
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

      {/* Locate Me (GPS) */}
      <button
        type="button"
        onClick={() => {
          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                if (pos?.coords) {
                  try {
                    map.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { animate: true, duration: 1.2 });
                  } catch (err) {
                    console.warn("LocateMe error:", err);
                  }
                }
              },
              () => {
                alert("Could not access your location. Please check browser permissions.");
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

      {/* Fullscreen Toggle (Maximize2 / Minimize2) */}
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

      {/* Map Theme Toggle (Sun / Moon) */}
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
        onClick={() => setMapType(prev => prev === 'detailed' ? 'standard' : 'detailed')}
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

// Custom Citizen Pin Marker Generator (Clean, crisp, no annoying constant flashing)
const createCitizenIcon = (status: 'blocked' | 'dispatched' | 'resolved') => {
  const colorMap = {
    blocked: {
      bg: '#DC2626',
    },
    dispatched: {
      bg: '#D97706',
    },
    resolved: {
      bg: '#059669',
    },
  };

  const style = colorMap[status] || colorMap.blocked;

  return L.divIcon({
    className: 'custom-citizen-marker',
    html: `
      <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-full cursor-pointer group">
        <div style="background-color: ${style.bg};" class="w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-125">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            ${status === 'resolved' 
              ? '<polyline points="20 6 9 17 4 12"></polyline>' 
              : status === 'dispatched'
                ? '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>'
                : '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'}
          </svg>
        </div>
        <div style="background-color: ${style.bg};" class="w-1.5 h-1.5 -mt-1 rotate-45 border-r border-b border-white"></div>
      </div>
    `,
    iconSize: [24, 28],
    iconAnchor: [12, 28],
    popupAnchor: [0, -30],
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
    color: '#10B981',
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
    color: '#F59E0B',
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
    color: '#EF4444',
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
}

export type StatusFilterType = 'all' | 'blocked' | 'dispatched' | 'resolved';

export default function PublicEsteroStatusMap() {
  const { theme: globalTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapTileType, setMapTileType] = useState<MapTileType>('detailed');
  const [isMapDark, setIsMapDark] = useState<boolean>(globalTheme === 'dark');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [reports, setReports] = useState<PublicReportItem[]>([]);
  const [isLegendOpen, setIsLegendOpen] = useState(true);

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

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [reports, statusFilter]);

  // Computed metric counts
  const totalCount = reports.length;
  const blockedCount = reports.filter(r => r.status === 'blocked').length;
  const dispatchedCount = reports.filter(r => r.status === 'dispatched').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;
  const overallFlowHealth = Math.round(
    CEBU_BASINS.reduce((acc, curr) => acc + curr.capacityScore, 0) / CEBU_BASINS.length
  );

  // Stylistic KPI Strip Filter metrics with visual proportion bars
  const kpiMetrics = [
    {
      filter: 'all' as const,
      label: 'TOTAL REPORTS',
      shortLabel: 'ALL',
      value: totalCount,
      subtext: 'All Active Pins',
      tone: 'text-text-primary',
      border: 'border-border-subtle',
      barBg: 'bg-brand-primary',
      pct: 100,
      pulse: false,
    },
    {
      filter: 'blocked' as const,
      label: 'BLOCKAGES',
      shortLabel: 'BLOCKED',
      value: blockedCount,
      subtext: `${totalCount > 0 ? Math.round((blockedCount / totalCount) * 100) : 0}% of Total`,
      tone: 'text-red-400',
      border: 'border-red-500/40',
      barBg: 'bg-red-500',
      pct: totalCount > 0 ? Math.round((blockedCount / totalCount) * 100) : 0,
      pulse: blockedCount > 0,
    },
    {
      filter: 'dispatched' as const,
      label: 'DISPATCHED',
      shortLabel: 'DISPATCH',
      value: dispatchedCount,
      subtext: `${totalCount > 0 ? Math.round((dispatchedCount / totalCount) * 100) : 0}% in Progress`,
      tone: 'text-amber-400',
      border: 'border-amber-500/40',
      barBg: 'bg-amber-500',
      pct: totalCount > 0 ? Math.round((dispatchedCount / totalCount) * 100) : 0,
      pulse: false,
    },
    {
      filter: 'resolved' as const,
      label: 'CLEARED',
      shortLabel: 'CLEARED',
      value: resolvedCount,
      subtext: `${totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0}% Restored`,
      tone: 'text-emerald-400',
      border: 'border-emerald-500/40',
      barBg: 'bg-emerald-500',
      pct: totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0,
      pulse: false,
    },
  ];

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 250);
  };

  return (
    <div className={twMerge(
      "w-full flex-1 min-h-0 flex flex-col transition-all duration-300",
      isFullscreen 
        ? "fixed inset-0 z-[999] bg-app-bg h-screen w-screen p-0 m-0" 
        : "h-[calc(100dvh-170px)] sm:h-[calc(100dvh-185px)] md:h-[calc(100dvh-200px)] min-h-[420px] md:min-h-[600px] mb-2 sm:mb-0"
    )}>
      
      {/* 1. Standardized Hero Header (Matches CitizenDashboard, Profile & Report Screens) */}
      {!isFullscreen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="shrink-0 mb-1.5 sm:mb-4 flex items-center justify-between gap-2 sm:gap-3"
        >
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-5xl font-heading font-black tracking-tight text-text-primary border-l-4 border-brand-primary pl-3 md:pl-4 truncate">
              Public Basin Map
            </h1>
            <p className="hidden md:block text-text-muted text-xs md:text-sm pl-5 mt-1">
              Live waterway flow, community blockage advisories, and ongoing city maintenance.
            </p>
          </div>

          {/* Report CTA Link */}
          <Link
            to="/citizen"
            className="bg-brand-primary hover:bg-brand-secondary text-white hover:text-black transition-colors px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-sm -skew-x-3 sm:-skew-x-6 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-md shrink-0 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 skew-x-3 sm:skew-x-6 shrink-0" />
            <span className="skew-x-3 sm:skew-x-6 hidden xs:inline">Report Blockage</span>
            <span className="skew-x-3 sm:skew-x-6 xs:hidden">Report</span>
          </Link>
        </motion.div>
      )}

      {/* 2. Stylistic KPI Strip Filter (Ultra-compact 4-column single row on mobile to maximize map height) */}
      {!isFullscreen && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="grid grid-cols-4 gap-1.5 sm:gap-3 mb-2 sm:mb-3 shrink-0"
        >
          {kpiMetrics.map((metric) => {
            const isSelected = statusFilter === metric.filter;
            return (
              <motion.button
                key={metric.label}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => setStatusFilter(metric.filter)}
                className={twMerge(
                  "group relative overflow-hidden flex h-10 sm:min-h-[56px] items-center border bg-surface/75 shadow-md backdrop-blur-md transition-all duration-300 hover:border-brand-primary -skew-x-2 sm:-skew-x-6 cursor-pointer text-left",
                  metric.border,
                  isSelected 
                    ? "ring-1 sm:ring-2 ring-brand-primary opacity-100 z-10 scale-[1.02]" 
                    : "opacity-85 hover:opacity-100"
                )}
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
                <div className="relative z-10 flex w-full items-center justify-between gap-1 px-1.5 sm:px-3.5 py-1 sm:py-2 skew-x-2 sm:skew-x-6">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] sm:text-[11px] font-mono font-bold tracking-wider uppercase text-text-secondary group-hover:text-brand-primary transition-colors truncate">
                      <span className="sm:hidden">{metric.shortLabel}</span>
                      <span className="hidden sm:inline">{metric.label}</span>
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-mono text-text-muted tracking-tight truncate hidden sm:inline">
                      {metric.subtext}
                    </span>
                  </div>
                  <span className={twMerge(
                    "text-xs sm:text-2xl font-mono font-bold shrink-0 leading-none",
                    metric.tone,
                    metric.pulse && "animate-pulse"
                  )}>
                    {metric.value}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* 3. Map Glassmorphic Card Container with BorderBeam Highlight */}
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        className={twMerge(
          "flex-1 w-full relative overflow-hidden transition-all duration-300 shadow-2xl min-h-[420px] md:min-h-[560px] lg:min-h-[640px]",
          isFullscreen 
            ? "rounded-none border-0 h-full" 
            : "rounded-sm border-2 border-border-subtle bg-surface/35 hover:bg-surface/50 backdrop-blur-xl"
        )}
      >
        {/* Traveling Highlight Beam (Disabled in Fullscreen) */}
        {!isFullscreen && <BorderBeam delay={0} color="#60A5FA" />}

        {/* 4. The Leaflet Map Instance */}
        <div className={twMerge(
          "w-full h-full absolute inset-0 transition-colors",
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

            {/* Custom Map Controls following BlockageSubmissionForm layout */}
            <CustomMapControls
              isMapDark={isMapDark}
              setIsMapDark={setIsMapDark}
              mapType={mapTileType}
              setMapType={setMapTileType}
              toggleFullScreen={toggleFullscreen}
              isFullscreen={isFullscreen}
            />

            {/* Basin Waterway Polylines */}
            {CEBU_BASINS.map((basin) => (
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

        {/* 5. Hideable Drainage Flow Legend (Bottom Right with Toggle Arrow) */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-[400] pointer-events-auto">
          <div className="bg-surface/95 backdrop-blur-md border border-border-subtle rounded-sm shadow-xl -skew-x-3 overflow-hidden transition-all duration-200 w-[210px] sm:w-[240px]">
            {/* Header / Toggle Button */}
            <button
              type="button"
              onClick={() => setIsLegendOpen(prev => !prev)}
              className="w-full px-2.5 py-1.5 flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider font-bold text-text-secondary hover:text-brand-primary transition-colors cursor-pointer"
              title={isLegendOpen ? "Hide Legend" : "Show Legend"}
              aria-label="Toggle Legend"
            >
              <span className="skew-x-3 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                <span>Drainage Flow</span>
              </span>
              <span className="skew-x-3 flex items-center gap-1">
                <span className="text-emerald-400 font-bold">{overallFlowHealth}%</span>
                {isLegendOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5 text-text-muted" />
                )}
              </span>
            </button>

            {/* Collapsible Content */}
            <AnimatePresence initial={false}>
              {isLegendOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-2.5 pb-2 pt-0.5 border-t border-border-subtle/50 skew-x-3 flex flex-col gap-1 text-[10px]"
                >
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-3 h-1 bg-emerald-500 rounded-full shrink-0" />
                    <span className="text-text-primary font-bold">Free Flowing (Normal)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1 bg-amber-500 rounded-full shrink-0" />
                    <span className="text-text-primary font-bold">Maintenance / Advisory</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1 bg-semantic-urgent rounded-full shrink-0" />
                    <span className="text-text-primary font-bold">Restricted / Blocked</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 6. Map Style & Mode Indicator (Bottom Left, mirroring BlockageSubmissionForm) */}
        <div className="absolute bottom-3 left-3 z-[400] bg-surface/90 backdrop-blur-md border border-border-subtle px-2.5 py-1 rounded-sm shadow-md flex items-center gap-1.5 -skew-x-3 pointer-events-none text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">
          <span className="skew-x-3 flex items-center gap-1.5">
            <span>{mapTileType === 'detailed' ? 'Map 1' : 'Map 2'}</span>
            <span className="text-text-muted opacity-40">|</span>
            <span className={isMapDark ? "text-amber-400" : "text-brand-primary"}>
              {isMapDark ? 'Dark' : 'Light'}
            </span>
          </span>
        </div>

      </motion.div>

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
      `}</style>

    </div>
  );
}
