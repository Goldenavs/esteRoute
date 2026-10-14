import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, type Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 35 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
};

export default function FeaturesSection() {
  const ref = useRef<HTMLElement>(null);
  
  // Dynamic header cycling word (cycles every 3 seconds)
  const [headerWordIndex, setHeaderWordIndex] = useState(0);
  const headerWords = ['Vision.', 'Meteorology.', 'Dispatch.'];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeaderWordIndex((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0px", "120px"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.6]);

  return (
    <motion.section 
      ref={ref}
      id="features" 
      style={{ y, opacity }}
      className="pt-24 pb-48 md:pb-64 px-6 lg:px-16 bg-transparent relative overflow-hidden z-10"
    >
      <div className="w-full max-w-7xl mx-auto">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16"
        >
          <div className="inline-flex items-center justify-center px-4 py-1.5 bg-brand-primary/10 border border-brand-primary/30 -skew-x-12 mb-6 backdrop-blur-md">
            <span className="skew-x-12 text-[11px] font-heading font-black tracking-widest text-brand-primary uppercase">
              Core Capabilities
            </span>
          </div>

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

          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: "5rem" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="h-1.5 bg-brand-primary mt-6 -skew-x-12" 
          />
        </motion.div>

        {/* Feature Grid with Frosted Glass Containers */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* ========================================================= */}
          {/* FEATURE 1: Frictionless Citizen Reporting (2 cols)        */}
          {/* ========================================================= */}
          <motion.div variants={cardVariants} className="md:col-span-2">
            <div className="group relative rounded-2xl bg-surface/40 backdrop-blur-xl border border-border-subtle p-7 md:p-8 h-full flex flex-col justify-between overflow-hidden hover:border-brand-primary/60 hover:shadow-[0_20px_50px_rgba(59,130,246,0.12)] hover:-translate-y-1.5 transition-all duration-500">
              {/* Subtle top edge glass reflection line */}
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent" />
              {/* Ambient radial hover sheen */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-primary/20 transition-all duration-700" />

              <div>
                {/* Meta Status Strip */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-subtle/60">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                    </span>
                    <span className="font-data text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                      Live Telemetry · Zero Auth Required
                    </span>
                  </div>
                  <span className="font-data text-[10px] font-bold px-2.5 py-1 rounded-full bg-surface-subtle/80 border border-border-subtle text-text-primary uppercase tracking-wider">
                    Capture ~1.8s
                  </span>
                </div>

                <h3 className="font-heading font-black text-2xl lg:text-3xl text-text-primary mb-3 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                  Frictionless Citizen Reporting
                </h3>
                <p className="text-sm md:text-base text-text-secondary leading-relaxed font-normal max-w-2xl mb-8">
                  Submit geotagged photos of canal blockages in seconds with zero friction. No account setup or mobile app download required. Precise GPS coordinates and incident metadata are ingested instantly.
                </p>
              </div>

              {/* Bespoke Visual: Simulated Viewfinder & Telemetry Reticle */}
              <div className="relative w-full h-36 rounded-xl bg-surface-subtle/40 border border-border-subtle overflow-hidden flex items-center justify-between p-5 group-hover:border-brand-primary/40 transition-colors">
                <div className="absolute inset-0 bg-[url('/Auth/CitizenAuth.jpg')] bg-cover bg-center opacity-15 scale-100 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-surface/80 via-surface/60 to-surface/80" />

                {/* Viewfinder Corner Crosshairs */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-brand-primary/70" />
                <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-brand-primary/70" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-brand-primary/70" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-brand-primary/70" />

                {/* HUD Data Overlay */}
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-sm bg-brand-primary animate-pulse" />
                    <span className="font-data text-[11px] font-bold tracking-widest text-text-primary uppercase">
                      TARGET ACQUIRED · ESTERO DRAINAGE
                    </span>
                  </div>
                  <span className="font-data text-[10px] text-text-secondary tracking-wider">
                    GPS: 14.5995° N, 120.9842° E [BINONDO SECTOR]
                  </span>
                </div>

                <div className="relative z-10 hidden sm:flex flex-col items-end justify-between h-full">
                  <span className="font-data text-[10px] font-bold px-2 py-0.5 rounded bg-brand-primary/20 border border-brand-primary/40 text-brand-primary uppercase">
                    AI Pre-Filter: Passed
                  </span>
                  <span className="font-data text-[10px] text-text-muted">
                    Format: Geotagged JPEG (EXIF Verified)
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ========================================================= */}
          {/* FEATURE 2: Meteorological Agent (1 col)                   */}
          {/* ========================================================= */}
          <motion.div variants={cardVariants} className="md:col-span-1">
            <div className="group relative rounded-2xl bg-surface/40 backdrop-blur-xl border border-border-subtle p-7 md:p-8 h-full flex flex-col justify-between overflow-hidden hover:border-brand-primary/60 hover:shadow-[0_20px_50px_rgba(59,130,246,0.12)] hover:-translate-y-1.5 transition-all duration-500">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent" />
              <div className="absolute -top-20 -left-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700" />

              <div>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-subtle/60">
                  <span className="font-data text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                    Open-Meteo · Live Radar
                  </span>
                  <span className="font-data text-[10px] font-bold px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                    48h Forecast
                  </span>
                </div>

                <h3 className="font-heading font-black text-2xl text-text-primary mb-3 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                  Meteorological Agent
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed font-normal mb-8">
                  Continuously cross-references localized 48-hour precipitation projections to calculate an urgent rainfall multiplier before flash floods happen.
                </p>
              </div>

              {/* Bespoke Visual: 48h Precipitation Barometer */}
              <div className="w-full rounded-xl bg-surface-subtle/40 border border-border-subtle p-4 group-hover:border-brand-primary/40 transition-colors">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="font-data text-[10px] uppercase tracking-wider text-text-muted">
                    Peak Probability
                  </span>
                  <span className="font-heading font-black text-2xl text-brand-primary">
                    84%
                  </span>
                </div>

                {/* 4-Step Rainfall Forecast Timeline */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { time: '+12h', pct: '18%', active: false },
                    { time: '+24h', pct: '42%', active: false },
                    { time: '+36h', pct: '84%', active: true },
                    { time: '+48h', pct: '56%', active: false },
                  ].map((bar, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5">
                      <div className="w-full h-12 bg-surface/60 rounded flex items-end p-0.5 overflow-hidden">
                        <div 
                          className={`w-full rounded-sm transition-all duration-500 ${
                            bar.active 
                              ? 'bg-brand-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                              : 'bg-brand-primary/30'
                          }`}
                          style={{ height: bar.pct }}
                        />
                      </div>
                      <span className="font-data text-[9px] text-text-secondary">{bar.time}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-border-subtle/50 flex items-center justify-between text-[10px] font-data text-text-muted">
                  <span>URGENCY MULTIPLIER</span>
                  <span className="font-bold text-semantic-warning">1.84x ELEVATED</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ========================================================= */}
          {/* FEATURE 3: Vision Triage Agent (1 col)                   */}
          {/* ========================================================= */}
          <motion.div variants={cardVariants} className="md:col-span-1">
            <div className="group relative rounded-2xl bg-surface/40 backdrop-blur-xl border border-border-subtle p-7 md:p-8 h-full flex flex-col justify-between overflow-hidden hover:border-brand-primary/60 hover:shadow-[0_20px_50px_rgba(59,130,246,0.12)] hover:-translate-y-1.5 transition-all duration-500">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent" />
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-primary/20 transition-all duration-700" />

              <div>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-subtle/60">
                  <span className="font-data text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                    Gemini 1.5 Flash
                  </span>
                  <span className="font-data text-[10px] font-bold px-2 py-0.5 rounded bg-semantic-success/10 text-semantic-success border border-semantic-success/20">
                    Neural Vision
                  </span>
                </div>

                <h3 className="font-heading font-black text-2xl text-text-primary mb-3 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                  Vision Triage Agent
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed font-normal mb-8">
                  Multimodal neural models decompose waste categories (plastics, silt, debris) and estimate canal blockage severity in under 4 seconds.
                </p>
              </div>

              {/* Bespoke Visual: Neural Decomposition Breakdown */}
              <div className="w-full rounded-xl bg-surface-subtle/40 border border-border-subtle p-4 group-hover:border-brand-primary/40 transition-colors">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="font-data text-[10px] uppercase tracking-wider text-text-muted">
                    Estimated Occlusion
                  </span>
                  <span className="font-heading font-black text-2xl text-brand-primary">
                    74%
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div>
                    <div className="flex justify-between text-[10px] font-data mb-1">
                      <span className="text-text-secondary">Plastics & Bottled Waste</span>
                      <span className="font-bold text-text-primary">68%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface/80 rounded-full overflow-hidden">
                      <div className="w-[68%] h-full bg-brand-primary rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-data mb-1">
                      <span className="text-text-secondary">Silt & Soil Runoff</span>
                      <span className="font-bold text-text-primary">24%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface/80 rounded-full overflow-hidden">
                      <div className="w-[24%] h-full bg-emerald-500 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border-subtle/50 flex items-center justify-between text-[10px] font-data text-text-muted">
                  <span>CONFIDENCE</span>
                  <span className="font-bold text-text-primary">98.4% HIGH ACCURACY</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ========================================================= */}
          {/* FEATURE 4: LGU Dispatcher Dashboard (2 cols)             */}
          {/* ========================================================= */}
          <motion.div variants={cardVariants} className="md:col-span-2">
            <div className="group relative rounded-2xl bg-surface/40 backdrop-blur-xl border border-border-subtle p-7 md:p-8 h-full flex flex-col justify-between overflow-hidden hover:border-brand-primary/60 hover:shadow-[0_20px_50px_rgba(59,130,246,0.12)] hover:-translate-y-1.5 transition-all duration-500">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />

              <div>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-subtle/60">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-semantic-success animate-pulse" />
                    <span className="font-data text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                      A* Fleet Routing Matrix · 12 Units Online
                    </span>
                  </div>
                  <span className="font-data text-[10px] font-bold px-2.5 py-1 rounded-full bg-surface-subtle/80 border border-border-subtle text-text-primary uppercase tracking-wider">
                    Console v2.4
                  </span>
                </div>

                <h3 className="font-heading font-black text-2xl lg:text-3xl text-text-primary mb-3 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                  LGU Dispatcher Dashboard
                </h3>
                <p className="text-sm md:text-base text-text-secondary leading-relaxed font-normal max-w-2xl mb-8">
                  A high-velocity dispatch console and dynamic priority queue. Automatically synthesizes rainfall models and blockage metrics to route cleanup crews to critical zones first.
                </p>
              </div>

              {/* Bespoke Visual: Live Dispatch Triage Matrix */}
              <div className="w-full rounded-xl bg-surface-subtle/40 border border-border-subtle p-4 group-hover:border-brand-primary/40 transition-colors">
                <div className="space-y-2">
                  {/* Task 1 */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface/70 border border-red-500/30">
                    <div className="flex items-center gap-3">
                      <span className="font-data text-[11px] font-bold text-red-500">
                        #EST-092
                      </span>
                      <span className="font-heading font-bold text-xs text-text-primary">
                        Estero de Binondo
                      </span>
                      <span className="hidden sm:inline font-data text-[10px] text-text-muted">
                        Occlusion: 88%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-data text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/30">
                        CRITICAL · FLEET EN ROUTE
                      </span>
                    </div>
                  </div>

                  {/* Task 2 */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface/70 border border-yellow-500/30">
                    <div className="flex items-center gap-3">
                      <span className="font-data text-[11px] font-bold text-yellow-500">
                        #EST-088
                      </span>
                      <span className="font-heading font-bold text-xs text-text-primary">
                        Estero de San Miguel
                      </span>
                      <span className="hidden sm:inline font-data text-[10px] text-text-muted">
                        Rain: 84% Imminent
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-data text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">
                        HIGH PRIORITY · QUEUED
                      </span>
                    </div>
                  </div>

                  {/* Task 3 */}
                  <div className="hidden sm:flex items-center justify-between p-2.5 rounded-lg bg-surface/50 border border-border-subtle">
                    <div className="flex items-center gap-3">
                      <span className="font-data text-[11px] font-bold text-emerald-500">
                        #EST-084
                      </span>
                      <span className="font-heading font-bold text-xs text-text-primary">
                        Estero de Quiapo
                      </span>
                      <span className="font-data text-[10px] text-text-muted">
                        2.1 Tons Silt Cleared
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-data text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        RESOLVED
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border-subtle/50 flex items-center justify-between text-[10px] font-data text-text-muted">
                  <span>DISPATCH QUEUE LATENCY: &lt; 0.8s</span>
                  <span className="text-text-secondary font-bold">100% AUDIT LOGGED</span>
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </motion.section>
  );
}
