import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  CheckCircle2, 
  CloudRain, 
  Sparkles, 
  LayoutDashboard, 
  ArrowRight, 
  RotateCcw, 
  Check, 
  ShieldCheck
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { createEsteroMarkerIcon, createDepotMarkerIcon } from '../../../lib/mapPins';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
};

// Subtle, traveling perimeter highlight
const BorderBeam = ({ delay = 0 }: { delay?: number }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-none z-10">
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`beam-grad-${delay}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3F72AF" stopOpacity="0" />
          <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.75" />
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
        stroke={`url(#beam-grad-${delay})`}
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
        className="opacity-30 group-hover:opacity-85 transition-opacity duration-500"
      />
    </svg>
  </div>
);

// Fake unpressable demo pins for the LGU Dispatcher interactive map
const DEMO_MAP_PINS = [
  { id: '1', lat: 10.3289, lng: 123.9212, score: 91.0, status: 'triaged', review: false, label: 'Mahiga Creek' },
  { id: '2', lat: 10.3015, lng: 123.9102, score: 78.5, status: 'triaged', review: false, label: 'Tejero Estero' },
  { id: '3', lat: 10.3120, lng: 123.9145, score: 54.0, status: 'triaged', review: false, label: 'Carreta Creek' },
  { id: '4', lat: 10.2970, lng: 123.8990, score: 22.0, status: 'triaged', review: false, label: 'Colon Drainage' },
  { id: '5', lat: 10.3340, lng: 123.9275, score: 85.0, status: 'in_progress', review: false, label: 'Subangdaku' },
];

export default function FeaturesSection() {
  const { theme } = useTheme();
  const [headerWordIndex, setHeaderWordIndex] = useState(0);
  const headerWords = ['Vision.', 'Meteorology.', 'Dispatch.'];

  // 1. Frictionless Citizen Reporting 3-Step Interactive Demo State
  const [citizenStep, setCitizenStep] = useState<0 | 1 | 2>(0);

  const CITIZEN_STEP_DATA = [
    {
      stepLabel: '01. Capture Photo',
      title: 'Step 1: Ground-Truth Photo Capture',
      desc: 'Citizens snap high-resolution visual evidence of obstructed canals or choked street drain inlets. The platform instantly validates image formats (JPEG, PNG, WebP) and size limits up to 8MB with optional 280-character context notes.',
    },
    {
      stepLabel: '02. Pinpoint Location',
      title: 'Step 2: Browser GPS Geotagging & Pin Drop',
      desc: 'Incident coordinates are captured automatically via HTML5 geolocation with accuracy under ±3 meters. Citizens can adjust the dropped pin on an interactive Leaflet map to guarantee millimeter-precise canal coordinates.',
    },
    {
      stepLabel: '03. Instant Docket',
      title: 'Step 3: Instant Reference & Tracking',
      desc: 'Zero account registration or app install needed. Submissions immediately generate a unique human-readable tracking code (e.g. ER-2026-928174) with milestone tracking for total civic transparency.',
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeaderWordIndex((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section 
      id="features" 
      className="pt-28 md:pt-36 pb-48 md:pb-64 px-6 lg:px-16 bg-transparent relative overflow-hidden z-10"
    >
      <div className="w-full max-w-7xl mx-auto">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16"
        >
          <h2 className="text-4xl lg:text-6xl font-heading font-black text-text-primary mb-4 flex flex-col items-start tracking-tighter uppercase leading-[1.08]">
            <span>Triage infrastructure.</span>
            <span className="text-text-muted mt-2">
              Powered by{' '}
              <span className="relative inline-block overflow-hidden align-bottom">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={headerWordIndex}
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: '0%', opacity: 1 }}
                    exit={{ y: '-100%', opacity: 0 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="inline-block text-brand-primary"
                  >
                    {headerWords[headerWordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
          </h2>

          <p className="text-base md:text-lg text-text-secondary max-w-3xl mt-6 font-medium leading-relaxed">
            An end-to-end urban drainage intelligence platform connecting real-time citizen reports with automated multimodal triage and priority dispatch.
          </p>

          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: "5rem" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="h-1.5 bg-brand-primary mt-6 -skew-x-12" 
          />
        </motion.div>

        {/* Feature Bento-Box Grid with Rich Tactical Textures */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >

          {/* ========================================================================= */}
          {/* FEATURE 1: Frictionless Citizen Reporting (2 cols) with Interactive Demo  */}
          {/* ========================================================================= */}
          <motion.div variants={cardVariants} className="md:col-span-2">
            <div className="group relative bg-surface/40 tactical-grid backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary hover:bg-surface/90 transition-all duration-300 -skew-x-3 md:-skew-x-12 p-6 md:p-8 h-full rounded-none shadow-sm hover:shadow-2xl overflow-hidden flex flex-col justify-between">
              <BorderBeam delay={0} />

              <div className="skew-x-3 md:skew-x-12 flex flex-col justify-between h-full">
                
                {/* Header with 3-Step Interactive Navigator */}
                <div className="pl-2 md:pl-5 pr-2 mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <h3 className="font-heading font-black text-2xl lg:text-3xl text-text-primary uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                      Frictionless Citizen Reporting
                    </h3>
                    
                    {/* Step Selector Pills */}
                    <div className="flex items-center gap-1.5 bg-surface-subtle/80 p-1 border border-border-subtle -skew-x-6">
                      {CITIZEN_STEP_DATA.map((item, idx) => (
                        <button
                          key={item.stepLabel}
                          onClick={() => setCitizenStep(idx as 0 | 1 | 2)}
                          className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            citizenStep === idx
                              ? 'bg-brand-primary text-white shadow-xs'
                              : 'text-text-muted hover:text-text-primary hover:bg-surface'
                          }`}
                        >
                          <span className="skew-x-6 inline-block">{item.stepLabel}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic description updating based on active step */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={citizenStep}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-xs font-mono font-bold text-brand-primary uppercase tracking-wider mb-1">
                        {CITIZEN_STEP_DATA[citizenStep].title}
                      </p>
                      <p className="text-sm md:text-base text-text-secondary leading-relaxed font-normal max-w-2xl">
                        {CITIZEN_STEP_DATA[citizenStep].desc}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Interactive Step Demonstration Canvas */}
                <div className="w-full min-h-[180px] bg-surface-subtle/60 tactical-dots border-2 border-border-subtle -skew-x-12 overflow-hidden relative group-hover:border-brand-primary/50 transition-colors p-3 sm:p-4 flex flex-col justify-center">
                  <div className="skew-x-12 w-full">
                    <AnimatePresence mode="wait">
                      
                      {/* DEMO STEP 0: Photo Capture Demonstration */}
                      {citizenStep === 0 && (
                        <motion.div 
                          key="step-photo"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className="flex flex-col sm:flex-row items-center justify-between gap-4"
                        >
                          <div className="relative w-full sm:w-48 h-32 border-2 border-brand-primary/50 bg-black/60 overflow-hidden flex items-center justify-center shrink-0">
                            <div 
                              className="absolute inset-0 bg-cover bg-center opacity-80"
                              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=400&q=80')` }}
                            />
                            {/* Viewfinder brackets */}
                            <div className="absolute inset-2 border border-dashed border-white/40 pointer-events-none" />
                            <div className="absolute bottom-1 left-2 bg-black/75 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400 font-bold">
                              CANAL_IMG_01.JPG (3.2MB)
                            </div>
                          </div>

                          <div className="flex-1 w-full space-y-2">
                            <div className="flex items-center justify-between text-xs font-mono bg-surface/90 border border-border-subtle p-2">
                              <span className="text-text-muted">IMAGE STATUS:</span>
                              <span className="text-emerald-500 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> CLIENT-VALIDATED
                              </span>
                            </div>
                            <div className="text-xs font-mono bg-surface/90 border border-border-subtle p-2">
                              <span className="text-text-muted">NOTES:</span>
                              <span className="text-text-primary ml-1 italic">"Bottleneck under bridge culvert, water stagnant"</span>
                            </div>
                            <button
                              onClick={() => setCitizenStep(1)}
                              className="text-[11px] font-heading font-bold text-brand-primary hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer pt-1"
                            >
                              Proceed to Location Verification <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* DEMO STEP 1: Geolocation Pinpoint Demonstration */}
                      {citizenStep === 1 && (
                        <motion.div 
                          key="step-location"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className="flex flex-col sm:flex-row items-center justify-between gap-4"
                        >
                          <div className="relative w-full sm:w-48 h-32 border-2 border-brand-primary/50 bg-black/60 overflow-hidden shrink-0">
                            {/* Embedded Mini Leaflet Map Preview */}
                            <MapContainer
                              center={[10.3157, 123.8854]}
                              zoom={14}
                              zoomControl={false}
                              attributionControl={false}
                              className={`w-full h-full ${theme === 'dark' ? 'dark-map' : ''}`}
                            >
                              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                              <Marker 
                                position={[10.3157, 123.8854]} 
                                icon={createEsteroMarkerIcon({ variant: 'critical', priorityScore: 88 })}
                              />
                            </MapContainer>
                          </div>

                          <div className="flex-1 w-full space-y-2">
                            <div className="flex items-center justify-between text-xs font-mono bg-surface/90 border border-border-subtle p-2">
                              <span className="text-text-muted">LAT / LNG:</span>
                              <span className="text-brand-primary font-bold">10.3157° N, 123.8854° E</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono bg-surface/90 border border-border-subtle p-2">
                              <span className="text-text-muted">LOCATION:</span>
                              <span className="text-text-primary font-bold">Colon St / City Hall Drainage</span>
                            </div>
                            <button
                              onClick={() => setCitizenStep(2)}
                              className="text-[11px] font-heading font-bold text-brand-primary hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer pt-1"
                            >
                              Proceed to Instant Docket Receipt <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* DEMO STEP 2: Instant Reference Docket */}
                      {citizenStep === 2 && (
                        <motion.div 
                          key="step-docket"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          className="flex flex-col sm:flex-row items-center justify-between gap-4"
                        >
                          <div className="w-full sm:w-48 h-32 bg-surface/90 border-2 border-brand-primary/60 p-3 flex flex-col justify-between shrink-0">
                            <div className="flex items-center justify-between text-[10px] font-mono text-brand-primary font-bold">
                              <span>ESTE-DOCKET</span>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-[9px] font-mono text-text-muted uppercase">CASE TRACKING ID</p>
                              <p className="text-base font-heading font-black text-text-primary tracking-tight">ER-2026-928174</p>
                            </div>
                            <span className="text-[9px] font-mono text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/25 inline-block">
                              STATUS: PENDING ANALYSIS
                            </span>
                          </div>

                          <div className="flex-1 w-full space-y-2">
                            <div className="text-xs font-mono bg-surface/90 border border-border-subtle p-2 flex items-center justify-between">
                              <span className="text-text-muted">INGESTION TIME:</span>
                              <span className="text-text-primary font-bold">&lt; 28.4 SECONDS</span>
                            </div>
                            <div className="text-xs font-mono bg-surface/90 border border-border-subtle p-2 flex items-center justify-between">
                              <span className="text-text-muted">AUTH REQUIREMENT:</span>
                              <span className="text-emerald-500 font-bold">ZERO INSTALL // GUEST ACCESSIBLE</span>
                            </div>
                            <button
                              onClick={() => setCitizenStep(0)}
                              className="text-[11px] font-heading font-bold text-text-secondary hover:text-brand-primary uppercase tracking-wider flex items-center gap-1 cursor-pointer pt-1"
                            >
                              <RotateCcw className="w-3 h-3" /> Replay Demonstration
                            </button>
                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* FEATURE 2: Meteorological Agent with Real Numbers & Computation Visual    */}
          {/* ========================================================================= */}
          <motion.div variants={cardVariants} className="md:col-span-1">
            <div className="group relative bg-surface/40 tactical-grid backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary hover:bg-surface/90 transition-all duration-300 -skew-x-3 md:-skew-x-12 p-6 md:p-8 h-full rounded-none shadow-sm hover:shadow-2xl overflow-hidden flex flex-col justify-between">
              <BorderBeam delay={2.25} />

              <div className="skew-x-3 md:skew-x-12 flex flex-col justify-between h-full">
                <div className="pl-2 md:pl-5 pr-2 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CloudRain className="w-4 h-4 text-brand-primary" />
                    <span className="text-[10px] font-mono text-brand-primary font-bold uppercase tracking-widest">
                      Open-Meteo // Doppler
                    </span>
                  </div>
                  <h3 className="font-heading font-black text-2xl text-text-primary mb-2 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                    Meteorological Agent
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed font-normal">
                    Queries hyper-local forecast models for the report's coordinates to calculate forward-looking flood urgency.
                  </p>
                </div>

                {/* Real Numerical Computation Visual Box */}
                <div className="w-full bg-surface-subtle/60 tactical-dots border-2 border-border-subtle -skew-x-12 p-4 relative group-hover:border-brand-primary/50 transition-colors">
                  <div className="skew-x-12 space-y-3">
                    
                    {/* Top Stat Line */}
                    <div className="flex items-baseline justify-between border-b border-border-subtle/70 pb-2">
                      <div>
                        <span className="font-heading font-black text-3xl md:text-4xl text-brand-primary leading-none">
                          84%
                        </span>
                        <span className="block font-data text-[9px] font-bold uppercase tracking-wider text-text-muted mt-0.5">
                          Rain Probability Index (RPI)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/30">
                          HIGH HAZARD
                        </span>
                        <span className="block font-data text-[9px] text-text-muted mt-1">
                          Peak 17:00 PHT
                        </span>
                      </div>
                    </div>

                    {/* 48-Hour Precipitation Curve Histogram */}
                    <div>
                      <div className="flex items-end justify-between gap-1 h-12 pt-1 border-b border-border-subtle">
                        {[22, 35, 52, 68, 84, 76, 55, 38, 20].map((val, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                            <div 
                              style={{ height: `${val}%` }} 
                              className={`w-full rounded-none transition-all ${
                                idx === 4 
                                  ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' 
                                  : val > 50 ? 'bg-amber-400' : 'bg-brand-primary/70'
                              }`} 
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-text-muted mt-1 uppercase">
                        <span>+0h</span>
                        <span className="text-rose-400 font-bold">+18h (Peak 38.5mm)</span>
                        <span>+48h</span>
                      </div>
                    </div>

                    {/* Formula Chip */}
                    <div className="bg-surface/90 border border-border-subtle p-2 text-[10px] font-mono flex items-center justify-between">
                      <span className="text-text-muted">FORMULA:</span>
                      <span className="text-brand-primary font-bold">RPI = max(Hourly Precip %)</span>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* FEATURE 3: Vision Triage Agent with Real Classification Breakdown         */}
          {/* ========================================================================= */}
          <motion.div variants={cardVariants} className="md:col-span-1">
            <div className="group relative bg-surface/40 tactical-grid backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary hover:bg-surface/90 transition-all duration-300 -skew-x-3 md:-skew-x-12 p-6 md:p-8 h-full rounded-none shadow-sm hover:shadow-2xl overflow-hidden flex flex-col justify-between">
              <BorderBeam delay={4.5} />

              <div className="skew-x-3 md:skew-x-12 flex flex-col justify-between h-full">
                <div className="pl-2 md:pl-5 pr-2 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-brand-primary" />
                    <span className="text-[10px] font-mono text-brand-primary font-bold uppercase tracking-widest">
                      Gemini 1.5 // Multimodal
                    </span>
                  </div>
                  <h3 className="font-heading font-black text-2xl text-text-primary mb-2 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                    Vision Triage Agent
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed font-normal">
                    Enforces anti-spoofing domain checks, classifies waste categories, and quantifies blockage severity.
                  </p>
                </div>

                {/* Real Waste Breakdown & Severity Metrics Box */}
                <div className="w-full bg-surface-subtle/60 tactical-dots border-2 border-border-subtle -skew-x-12 p-4 relative group-hover:border-brand-primary/50 transition-colors">
                  <div className="skew-x-12 space-y-3">
                    
                    {/* Domain Gate & Severity Score Line */}
                    <div className="flex items-baseline justify-between border-b border-border-subtle/70 pb-2">
                      <div>
                        <span className="font-heading font-black text-3xl md:text-4xl text-rose-500 leading-none">
                          78.0
                        </span>
                        <span className="block font-data text-[9px] font-bold uppercase tracking-wider text-text-muted mt-0.5">
                          Blockage Severity (0-100)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 border border-emerald-500/30 flex items-center gap-1 justify-end">
                          <ShieldCheck className="w-3 h-3" /> CANAL VERIFIED
                        </span>
                        <span className="block font-data text-[9px] text-text-muted mt-1">
                          Latency: 1.84s
                        </span>
                      </div>
                    </div>

                    {/* Waste Composition Category Progress Bars */}
                    <div className="space-y-1.5 text-[10px] font-mono">
                      <div>
                        <div className="flex justify-between text-text-secondary mb-0.5">
                          <span>PLASTICS (CHOKING):</span>
                          <span className="font-bold text-text-primary">48%</span>
                        </div>
                        <div className="h-1.5 bg-surface border border-border-subtle overflow-hidden">
                          <div className="h-full bg-rose-500" style={{ width: '48%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-text-secondary mb-0.5">
                          <span>ORGANIC / WEEDS:</span>
                          <span className="font-bold text-text-primary">28%</span>
                        </div>
                        <div className="h-1.5 bg-surface border border-border-subtle overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: '28%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-text-secondary mb-0.5">
                          <span>SILT & SEDIMENT:</span>
                          <span className="font-bold text-text-primary">16%</span>
                        </div>
                        <div className="h-1.5 bg-surface border border-border-subtle overflow-hidden">
                          <div className="h-full bg-brand-primary" style={{ width: '16%' }} />
                        </div>
                      </div>
                    </div>

                    {/* AI Prompt Synthesis Note */}
                    <p className="text-[9px] font-mono text-text-muted italic truncate">
                      "Severe cross-sectional intake obstruction by bottles and vegetal debris."
                    </p>

                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* FEATURE 4: LGU Dispatcher Dashboard (2 cols) with Real Embedded Map       */}
          {/* ========================================================================= */}
          <motion.div variants={cardVariants} className="md:col-span-2">
            <div className="group relative bg-surface/40 tactical-grid backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary hover:bg-surface/90 transition-all duration-300 -skew-x-3 md:-skew-x-12 p-6 md:p-8 h-full rounded-none shadow-sm hover:shadow-2xl overflow-hidden flex flex-col justify-between">
              <BorderBeam delay={6.75} />

              <div className="skew-x-3 md:skew-x-12 flex flex-col justify-between h-full">
                
                {/* Header */}
                <div className="pl-2 md:pl-5 pr-2 mb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-brand-primary" />
                      <span className="text-[10px] font-mono text-brand-primary font-bold uppercase tracking-widest">
                        Decision Synthesis // 60% Vision + 40% Rain
                      </span>
                    </div>

                    {/* Live Status Chip */}
                    <span className="text-[10px] font-mono font-bold bg-brand-primary/10 border border-brand-primary/30 text-brand-primary px-2 py-0.5">
                      ACTIVE QUEUE: 5 BOTTLENECKS
                    </span>
                  </div>

                  <h3 className="font-heading font-black text-2xl lg:text-3xl text-text-primary mb-2 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                    LGU Dispatcher Command Dashboard
                  </h3>
                  <p className="text-sm md:text-base text-text-secondary leading-relaxed font-normal max-w-2xl">
                    A real-time GIS decision matrix combining weather hazards and blockage metrics. Automatically calculates nearest-neighbor routes to clear critical canal choke points first.
                  </p>
                </div>

                {/* Real Interactive Movable Leaflet Map Container */}
                <div className="w-full h-48 sm:h-56 bg-surface-subtle/80 tactical-dots border-2 border-border-subtle -skew-x-12 overflow-hidden relative group-hover:border-brand-primary/50 transition-colors">
                  <div className="skew-x-12 w-full h-full relative">
                    
                    {/* Embedded Movable Interactive Leaflet Map */}
                    <MapContainer
                      center={[10.3157, 123.9100]}
                      zoom={13}
                      scrollWheelZoom={false}
                      attributionControl={false}
                      className={`w-full h-full z-0 cursor-grab active:cursor-grabbing ${
                        theme === 'dark' ? 'dark-map' : ''
                      }`}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      
                      {/* Operations Base Depot Pin */}
                      <Marker
                        position={[10.2930, 123.9015]}
                        icon={createDepotMarkerIcon({
                          isSelected: true,
                          isCustom: false,
                          tag: 'Cebu City Hall HQ'
                        })}
                      />

                      {/* Fake Unpressable Priority Estero Pins */}
                      {DEMO_MAP_PINS.map((pin) => (
                        <Marker
                          key={pin.id}
                          position={[pin.lat, pin.lng]}
                          icon={createEsteroMarkerIcon({
                            status: pin.status,
                            priorityScore: pin.score,
                            needsReview: pin.review,
                          })}
                        />
                      ))}
                    </MapContainer>

                    {/* Floating Tactical Overlay Telemetry Pill */}
                    <div className="absolute top-2 left-2 z-[400] pointer-events-none bg-black/75 backdrop-blur-md px-2.5 py-1 border border-white/20 text-[10px] font-mono text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold uppercase tracking-wider">LIVE CEBU BASIN GIS // DRAG MAP TO EXPLORE</span>
                    </div>

                    {/* Bottom Floating Legend */}
                    <div className="absolute bottom-2 right-2 z-[400] pointer-events-none bg-black/80 backdrop-blur-md px-2.5 py-1 border border-white/20 text-[9px] font-mono text-white/90 hidden sm:flex items-center gap-3">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> URGENT (&ge;80)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> HIGH (60-79)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> RESOLVED</span>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
