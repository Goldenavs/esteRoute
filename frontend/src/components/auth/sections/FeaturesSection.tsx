import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
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

// Perimeter traveling light
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
  { id: '1', lat: 10.3289, lng: 123.9212, score: 91.0, status: 'triaged', review: false },
  { id: '2', lat: 10.3015, lng: 123.9102, score: 78.5, status: 'triaged', review: false },
  { id: '3', lat: 10.3120, lng: 123.9145, score: 54.0, status: 'triaged', review: false },
  { id: '4', lat: 10.2970, lng: 123.8990, score: 22.0, status: 'triaged', review: false },
  { id: '5', lat: 10.3340, lng: 123.9275, score: 85.0, status: 'in_progress', review: false },
];

export default function FeaturesSection() {
  const { theme } = useTheme();

  // Dynamic header cycling
  const [headerWordIndex, setHeaderWordIndex] = useState(0);
  const headerWords = ['Vision.', 'Meteorology.', 'Dispatch.'];

  // Frictionless Citizen Reporting 3-Step Selection: 1 = Photo, 2 = Location, 3 = Submit
  const [citizenStep, setCitizenStep] = useState<1 | 2 | 3>(1);

  const CITIZEN_STEP_DESCRIPTIONS = {
    1: {
      headline: 'Step 01 / Photo Capture & Format Validation',
      body: 'Citizens capture or upload ground-truth photos of clogged esteros, culverts, or street inlets. The system validates image formats (JPEG, PNG, WebP) and 8MB size limits in real time with optional 280-character context notes.'
    },
    2: {
      headline: 'Step 02 / Automated Geotagging & Pin Drop',
      body: 'Incident GPS coordinates are automatically retrieved via browser geolocation with pinpoint accuracy under ±3 meters. Citizens can freely drag and drop the map pin to guarantee millimeter-accurate location data before submission.'
    },
    3: {
      headline: 'Step 03 / Zero-Install Submission & Instant Docket',
      body: 'Anonymous guest reporting with zero account registration. Submissions immediately generate a unique tracking reference (e.g. ER-2026-928174) with live milestone tracking for total community transparency.'
    }
  };

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

        {/* Feature Bento-Box Grid: Outer Boxes are NOT skewed */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >

          {/* ========================================================================= */}
          {/* FEATURE 1: Frictionless Citizen Reporting (2 cols)                        */}
          {/* Outer Box: Clean unskewed | Steps: Direct Stepper Buttons without box     */}
          {/* ========================================================================= */}
          <motion.div variants={cardVariants} className="md:col-span-2">
            <div className="group relative bg-surface/20 hover:bg-surface/85 hover:backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary transition-all duration-500 p-6 md:p-8 h-full rounded-none shadow-sm hover:shadow-2xl overflow-hidden flex flex-col justify-center">
              <BorderBeam delay={0} />

              <div className="relative z-10 flex flex-col justify-center h-full space-y-6 sm:space-y-8">
                
                {/* Upper Area: Title & Dynamic Description that changes per clicked button */}
                <div className="pr-2">
                  <h3 className="font-heading font-black text-2xl lg:text-3xl text-text-primary uppercase tracking-tight group-hover:text-brand-primary transition-colors mb-2">
                    Frictionless Citizen Reporting
                  </h3>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={citizenStep}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 min-h-[4rem]"
                    >
                      <p className="text-xs font-mono font-bold text-brand-primary uppercase tracking-wider mb-1.5">
                        {CITIZEN_STEP_DESCRIPTIONS[citizenStep].headline}
                      </p>
                      <p className="text-sm md:text-base text-text-secondary leading-relaxed font-normal max-w-2xl">
                        {CITIZEN_STEP_DESCRIPTIONS[citizenStep].body}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Bottom Area: Exact Stepper UI directly, NO background container box */}
                <div className="w-full">
                  <div className="flex items-center justify-between px-1 sm:px-4 w-full max-w-md">
                    
                    {/* Step 1: Photo Button */}
                    <button
                      type="button"
                      onClick={() => setCitizenStep(1)}
                      className="flex-1 flex flex-col items-center gap-1 transition-transform active:scale-95 relative z-10 group cursor-pointer"
                    >
                      <div className="relative">
                        {citizenStep === 1 && (
                          <span className="absolute -inset-1 rounded-sm bg-brand-primary/40 animate-pulse blur-[3px] -skew-x-[3deg]" />
                        )}
                        <div className={`relative w-8 h-8 rounded-sm -skew-x-[3deg] flex items-center justify-center text-xs font-mono font-bold transition-all border ${
                          citizenStep === 1
                            ? 'bg-brand-primary text-white border-brand-primary shadow-[0_0_15px_rgba(63,114,175,0.5)]'
                            : 'bg-surface/80 text-text-muted border-border-subtle group-hover:border-text-muted'
                        }`}>
                          <span className="skew-x-[3deg]">01</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {citizenStep === 1 && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-80" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-primary" />
                          </span>
                        )}
                        <span className={`text-[10px] font-bold tracking-wider uppercase transition-colors font-mono ${
                          citizenStep === 1 ? 'text-brand-primary' : 'text-text-muted'
                        }`}>
                          Photo
                        </span>
                      </div>
                    </button>

                    {/* Connector Line 1-2 */}
                    <div className="h-[2px] w-10 sm:w-16 -mt-4 mx-1.5 transition-colors relative overflow-hidden bg-border-strong rounded-full">
                      <div
                        className={`h-full transition-all duration-500 ${
                          citizenStep > 1
                            ? 'w-full bg-gradient-to-r from-brand-primary to-brand-primary/80'
                            : 'w-0'
                        }`}
                      />
                    </div>

                    {/* Step 2: Location Button */}
                    <button
                      type="button"
                      onClick={() => setCitizenStep(2)}
                      className="flex-1 flex flex-col items-center gap-1 transition-transform active:scale-95 relative z-10 group cursor-pointer"
                    >
                      <div className="relative">
                        {citizenStep === 2 && (
                          <span className="absolute -inset-1 rounded-sm bg-brand-primary/40 animate-pulse blur-[3px] -skew-x-[3deg]" />
                        )}
                        <div className={`relative w-8 h-8 rounded-sm -skew-x-[3deg] flex items-center justify-center text-xs font-mono font-bold transition-all border ${
                          citizenStep === 2
                            ? 'bg-brand-primary text-white border-brand-primary shadow-[0_0_15px_rgba(63,114,175,0.5)]'
                            : 'bg-surface/80 text-text-muted border-border-subtle group-hover:border-text-muted'
                        }`}>
                          <span className="skew-x-[3deg]">02</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {citizenStep === 2 && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-80" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-primary" />
                          </span>
                        )}
                        <span className={`text-[10px] font-bold tracking-wider uppercase transition-colors font-mono ${
                          citizenStep === 2 ? 'text-brand-primary' : 'text-text-muted'
                        }`}>
                          Location
                        </span>
                      </div>
                    </button>

                    {/* Connector Line 2-3 */}
                    <div className="h-[2px] w-10 sm:w-16 -mt-4 mx-1.5 transition-colors relative overflow-hidden bg-border-strong rounded-full">
                      <div
                        className={`h-full transition-all duration-500 ${
                          citizenStep === 3
                            ? 'w-full bg-gradient-to-r from-brand-primary to-brand-primary/80'
                            : 'w-0'
                        }`}
                      />
                    </div>

                    {/* Step 3: Submit Button */}
                    <button
                      type="button"
                      onClick={() => setCitizenStep(3)}
                      className="flex-1 flex flex-col items-center gap-1 transition-transform active:scale-95 relative z-10 group cursor-pointer"
                    >
                      <div className="relative">
                        {citizenStep === 3 && (
                          <span className="absolute -inset-1 rounded-sm bg-brand-primary/40 animate-pulse blur-[3px] -skew-x-[3deg]" />
                        )}
                        <div className={`relative w-8 h-8 rounded-sm -skew-x-[3deg] flex items-center justify-center text-xs font-mono font-bold transition-all border ${
                          citizenStep === 3
                            ? 'bg-brand-primary text-white border-brand-primary shadow-[0_0_15px_rgba(63,114,175,0.5)]'
                            : 'bg-surface/80 text-text-muted border-border-subtle group-hover:border-text-muted'
                        }`}>
                          <span className="skew-x-[3deg]">03</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {citizenStep === 3 && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-80" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-primary" />
                          </span>
                        )}
                        <span className={`text-[10px] font-bold tracking-wider uppercase transition-colors font-mono ${
                          citizenStep === 3 ? 'text-brand-primary' : 'text-text-muted'
                        }`}>
                          Submit
                        </span>
                      </div>
                    </button>

                  </div>
                </div>

              </div>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* FEATURE 2: Meteorological Agent                                           */}
          {/* Outer Box: Clean unskewed | Inner Data Box: SKEWED                        */}
          {/* ========================================================================= */}
          <motion.div variants={cardVariants} className="md:col-span-1">
            <div className="group relative bg-surface/20 hover:bg-surface/85 hover:backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary transition-all duration-500 p-6 md:p-8 h-full rounded-none shadow-sm hover:shadow-2xl overflow-hidden flex flex-col justify-between">
              <BorderBeam delay={2.25} />

              <div className="relative z-10 flex flex-col justify-between h-full space-y-5">
                <div>
                  <h3 className="font-heading font-black text-2xl text-text-primary mb-2 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                    Meteorological Agent
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed font-normal">
                    Queries hyper-local forecast models for the report's coordinates to calculate forward-looking flood urgency.
                  </p>
                </div>

                {/* SKEWED Inner Data Box */}
                <div className="w-full bg-surface/30 backdrop-blur-md border border-border-subtle p-4 sm:p-5 rounded-none -skew-x-3 md:-skew-x-6 overflow-hidden">
                  <div className="skew-x-3 md:skew-x-6 space-y-3 px-1">
                    
                    {/* Real Numbers & Computed RPI */}
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
                        <span className="font-mono text-xs font-bold text-text-primary">
                          Peak 17:00 PHT
                        </span>
                        <span className="block font-data text-[9px] text-text-muted mt-0.5">
                          Next 48 Hours
                        </span>
                      </div>
                    </div>

                    {/* 48-Hour Rainfall Distribution Histogram */}
                    <div>
                      <div className="flex items-end justify-between gap-1.5 h-12 pt-1 border-b border-border-subtle">
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
                        <span>Now</span>
                        <span className="text-rose-400 font-bold">+18h (Peak 38.5mm)</span>
                        <span>+48h</span>
                      </div>
                    </div>

                    {/* Formula Chip */}
                    <div className="bg-surface-subtle/60 border border-border-subtle px-2.5 py-1.5 text-[10px] font-mono flex items-center justify-between">
                      <span className="text-text-muted">FORMULA:</span>
                      <span className="text-brand-primary font-bold">RPI = max(Hourly Precip %)</span>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* FEATURE 3: Vision Triage Agent                                            */}
          {/* Outer Box: Clean unskewed | Inner Data Box: SKEWED                        */}
          {/* ========================================================================= */}
          <motion.div variants={cardVariants} className="md:col-span-1">
            <div className="group relative bg-surface/20 hover:bg-surface/85 hover:backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary transition-all duration-500 p-6 md:p-8 h-full rounded-none shadow-sm hover:shadow-2xl overflow-hidden flex flex-col justify-between">
              <BorderBeam delay={4.5} />

              <div className="relative z-10 flex flex-col justify-between h-full space-y-5">
                <div>
                  <h3 className="font-heading font-black text-2xl text-text-primary mb-2 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                    Vision Triage Agent
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed font-normal">
                    Gemini 1.5 Flash multimodal AI classifies waste composition and quantifies waterway blockage severity from photos.
                  </p>
                </div>

                {/* SKEWED Inner Data Box */}
                <div className="w-full bg-surface/30 backdrop-blur-md border border-border-subtle p-4 sm:p-5 rounded-none -skew-x-3 md:-skew-x-6 overflow-hidden">
                  <div className="skew-x-3 md:skew-x-6 space-y-3 px-1">
                    
                    {/* Real Numbers & Computed Severity */}
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
                        <span className="font-mono text-xs font-bold text-rose-500">
                          Critical Choke
                        </span>
                        <span className="block font-data text-[9px] text-text-muted mt-0.5">
                          Multimodal Triage
                        </span>
                      </div>
                    </div>

                    {/* Real Waste Breakdown Progress Bars */}
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

                    {/* Rationale Quote */}
                    <p className="text-[9px] font-mono text-text-muted italic truncate">
                      "Heavy plastic bottles and vegetative debris obstructing intake."
                    </p>

                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ========================================================================= */}
          {/* FEATURE 4: LGU Dispatcher Dashboard                                       */}
          {/* Outer Box: Clean unskewed | Map Container: SKEWED WITH OVERSIZED MAP (NO WHITE GAPS) */}
          {/* ========================================================================= */}
          <motion.div variants={cardVariants} className="md:col-span-2">
            <div className="group relative bg-surface/20 hover:bg-surface/85 hover:backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary transition-all duration-500 p-6 md:p-8 h-full rounded-none shadow-sm hover:shadow-2xl overflow-hidden flex flex-col justify-between">
              <BorderBeam delay={6.75} />

              <div className="relative z-10 flex flex-col justify-between h-full space-y-5">
                
                {/* Header */}
                <div className="pr-2">
                  <h3 className="font-heading font-black text-2xl lg:text-3xl text-text-primary mb-2 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                    LGU Dispatcher Dashboard
                  </h3>
                  <p className="text-sm md:text-base text-text-secondary leading-relaxed font-normal max-w-2xl">
                    A real-time command dashboard synthesizing rainfall forecast data and blockage metrics. Dispatches maintenance crews to critical bottlenecks first using nearest-neighbor route optimization.
                  </p>
                </div>

                {/* SKEWED Map Container with Oversized Non-Skewed Leaflet Viewport (100% Tile Bleed, NO White Gaps) */}
                <div className="w-full h-52 sm:h-64 rounded-none border border-border-subtle overflow-hidden relative shadow-inner -skew-x-3 md:-skew-x-8 bg-black/40">
                  <div className="skew-x-3 md:skew-x-8 w-full h-full relative flex items-center justify-center">
                    
                    {/* Oversized Map to completely cover skewed bounding angles */}
                    <MapContainer
                      center={[10.3157, 123.9050]}
                      zoom={14}
                      scrollWheelZoom={false}
                      attributionControl={false}
                      style={{ width: '135%', height: '120%', minWidth: '135%', flexShrink: 0 }}
                      className={`z-0 cursor-grab active:cursor-grabbing ${
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

                      {/* Real Priority Estero Pins */}
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
