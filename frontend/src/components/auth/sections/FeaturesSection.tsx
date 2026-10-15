import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, type Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
};

// Subtle, eye-friendly traveling perimeter highlight (staggered across cards)
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

        {/* Feature Grid with Minimalist Skewed Frosted Glass Cards */}
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
            <div className="group relative bg-surface/35 backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary hover:bg-surface/95 transition-all duration-300 -skew-x-3 md:-skew-x-12 p-6 md:p-8 h-full rounded-none shadow-sm hover:shadow-2xl overflow-hidden">
              {/* Eye-friendly perimeter traveling light */}
              <BorderBeam delay={0} />

              <div className="skew-x-3 md:skew-x-12 h-full flex flex-col justify-between">
                <div className="pl-2 md:pl-6 pr-2">
                  <h3 className="font-heading font-black text-2xl lg:text-3xl text-text-primary mb-3 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                    Frictionless Citizen Reporting
                  </h3>
                  <p className="text-sm md:text-base text-text-secondary leading-relaxed font-normal max-w-2xl mb-8">
                    Submit geotagged photos of canal obstructions in seconds. Zero registration or app install required. Incident coordinates are captured automatically with optional descriptive notes.
                  </p>
                </div>

                {/* Symmetrically centered parallel-skewed inner letterbox */}
                <div className="w-full h-28 md:h-32 bg-surface-subtle/50 border-2 border-border-subtle -skew-x-12 flex items-center justify-center overflow-hidden relative group-hover:border-brand-primary/50 transition-colors">
                  <div 
                    className="absolute inset-y-0 -inset-x-10 opacity-20 bg-[url('/Auth/CitizenAuth.jpg')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ transform: 'skewX(12deg)' }}
                  />
                  <span className="skew-x-12 font-heading font-black text-xs md:text-sm lg:text-base text-text-primary uppercase tracking-widest z-10 drop-shadow-sm px-4 text-center">
                    No App Install Needed · Instant Ingestion
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ========================================================= */}
          {/* FEATURE 2: Meteorological Agent (1 col)                   */}
          {/* ========================================================= */}
          <motion.div variants={cardVariants} className="md:col-span-1">
            <div className="group relative bg-surface/35 backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary hover:bg-surface/95 transition-all duration-300 -skew-x-3 md:-skew-x-12 p-6 md:p-8 h-full rounded-none shadow-sm hover:shadow-2xl overflow-hidden">
              <BorderBeam delay={2.25} />

              <div className="skew-x-3 md:skew-x-12 h-full flex flex-col justify-between">
                <div className="pl-2 md:pl-5 pr-2">
                  <h3 className="font-heading font-black text-2xl text-text-primary mb-3 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                    Meteorological Agent
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed font-normal mb-8">
                    Cross-references 48-hour precipitation data via Open-Meteo. Computes dynamic rain probability indices to preempt flash floods before downpours occur.
                  </p>
                </div>

                {/* Symmetrically centered parallel-skewed inner stat block */}
                <div className="w-full h-28 md:h-32 bg-surface-subtle/50 border-2 border-border-subtle -skew-x-12 flex flex-col items-center justify-center p-4 relative group-hover:border-brand-primary/50 transition-colors">
                  <div className="skew-x-12 flex flex-col items-center">
                    <span className="font-heading font-black text-3xl md:text-4xl text-brand-primary leading-none mb-1">
                      84%
                    </span>
                    <span className="font-data text-[10px] font-bold uppercase tracking-widest text-text-muted text-center">
                      Peak 48h Rain Hazard Index
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ========================================================= */}
          {/* FEATURE 3: Vision Triage Agent (1 col)                   */}
          {/* ========================================================= */}
          <motion.div variants={cardVariants} className="md:col-span-1">
            <div className="group relative bg-surface/35 backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary hover:bg-surface/95 transition-all duration-300 -skew-x-3 md:-skew-x-12 p-6 md:p-8 h-full rounded-none shadow-sm hover:shadow-2xl overflow-hidden">
              <BorderBeam delay={4.5} />

              <div className="skew-x-3 md:skew-x-12 h-full flex flex-col justify-between">
                <div className="pl-2 md:pl-5 pr-2">
                  <h3 className="font-heading font-black text-2xl text-text-primary mb-3 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                    Vision Triage Agent
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed font-normal mb-8">
                    Gemini 1.5 Flash multimodal AI classifies waste composition (plastics, silt, debris) and quantifies waterway blockage severity from photos.
                  </p>
                </div>

                {/* Symmetrically centered parallel-skewed inner stat block */}
                <div className="w-full h-28 md:h-32 bg-surface-subtle/50 border-2 border-border-subtle -skew-x-12 flex flex-col items-center justify-center p-4 relative group-hover:border-brand-primary/50 transition-colors">
                  <div className="skew-x-12 flex flex-col items-center">
                    <span className="font-heading font-black text-3xl md:text-4xl text-brand-primary leading-none mb-1">
                      &lt; 4.2s
                    </span>
                    <span className="font-data text-[10px] font-bold uppercase tracking-widest text-text-muted text-center">
                      Inference & Severity Triage
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ========================================================= */}
          {/* FEATURE 4: LGU Dispatcher Dashboard (2 cols)             */}
          {/* ========================================================= */}
          <motion.div variants={cardVariants} className="md:col-span-2">
            <div className="group relative bg-surface/35 backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary hover:bg-surface/95 transition-all duration-300 -skew-x-3 md:-skew-x-12 p-6 md:p-8 h-full rounded-none shadow-sm hover:shadow-2xl overflow-hidden">
              <BorderBeam delay={6.75} />

              <div className="skew-x-3 md:skew-x-12 h-full flex flex-col justify-between">
                <div className="pl-2 md:pl-6 pr-2">
                  <h3 className="font-heading font-black text-2xl lg:text-3xl text-text-primary mb-3 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                    LGU Dispatcher Dashboard
                  </h3>
                  <p className="text-sm md:text-base text-text-secondary leading-relaxed font-normal max-w-2xl mb-8">
                    A real-time prioritized triage queue and GIS dispatch matrix. Synthesizes rainfall forecast data and blockage metrics to direct cleanup crews to critical bottlenecks first.
                  </p>
                </div>

                {/* Symmetrically centered parallel-skewed inner letterbox */}
                <div className="w-full h-28 md:h-32 bg-surface-subtle/50 border-2 border-border-subtle -skew-x-12 flex items-center justify-center overflow-hidden relative group-hover:border-brand-primary/50 transition-colors">
                  <div 
                    className="absolute inset-y-0 -inset-x-10 opacity-20 bg-[url('/Auth/AdminAuth.jpg')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ transform: 'skewX(12deg)' }}
                  />
                  <span className="skew-x-12 font-heading font-black text-xs md:text-sm lg:text-base text-text-primary uppercase tracking-widest z-10 drop-shadow-md px-4 text-center">
                    Real-Time Priority Queue · A* Optimization
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </motion.section>
  );
}
