import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Camera, Sparkles, CloudRain, BrainCircuit, Database, MonitorDot } from 'lucide-react';

interface SharpNodeProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  borderColor: string;
  iconColor: string;
  bgColor?: string;
  delay: number;
}

const SharpNode = ({ icon, label, sublabel, borderColor, iconColor, bgColor = "bg-app-bg", delay }: SharpNodeProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
    className="flex flex-col items-center z-10 relative group"
  >
    <div className={`w-20 h-20 md:w-28 md:h-28 -skew-x-12 border-2 flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-xl ${bgColor} ${borderColor}`}>
      <div className={`skew-x-12 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full transition-transform duration-300 transform group-hover:scale-110 ${iconColor}`}>
        {icon}
      </div>
    </div>
    <div className={`mt-4 md:mt-6 px-3 md:px-4 py-1.5 md:py-2 border-2 -skew-x-12 text-[10px] md:text-xs font-heading font-black tracking-widest uppercase shadow-md transition-colors ${bgColor} ${borderColor}`}>
      <div className="skew-x-12 flex flex-col items-center text-text-primary text-center">
        <span>{label}</span>
        {sublabel && <span className="text-[9px] text-brand-primary mt-0.5">{sublabel}</span>}
      </div>
    </div>
  </motion.div>
);

export default function CoreEngineSection() {
  const ref = useRef<HTMLElement>(null);
  
  // Dynamic header cycling word (cycles every 3 seconds)
  const [headerWordIndex, setHeaderWordIndex] = useState(0);
  const headerWords = ['Orchestration.', 'Synthesis.', 'Execution.'];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeaderWordIndex((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["end end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  const PATH_UPPER = "M 50,220 C 150,220 180,105 280,105 L 290,105 C 390,105 415,220 505,220 L 725,220 L 970,220";
  const PATH_LOWER = "M 50,220 C 150,220 180,335 280,335 L 290,335 C 390,335 415,220 505,220 L 725,220 L 970,220";

  return (
    <section 
      id="core-engine" 
      ref={ref}
      className="relative z-20 flex flex-col items-center overflow-hidden border-y-2 border-border-subtle shadow-2xl"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--theme-surface) 50%, transparent)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        clipPath: 'polygon(0 5vw, 100% 0, 100% 100%, 0 calc(100% - 5vw))',
        marginTop: '-5vw',
        marginBottom: '-5vw',
        paddingTop: 'calc(5vw + 6rem)',
        paddingBottom: 'calc(5vw + 6rem)',
        minHeight: '100vh'
      }}
    >
      <motion.div style={{ y, opacity }} className="w-full max-w-7xl mx-auto px-6 lg:px-16 flex flex-col relative z-0">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16"
        >
          <div className="inline-flex items-center justify-center px-4 py-2 bg-brand-primary/10 border-2 border-brand-primary/20 -skew-x-12 mb-6 backdrop-blur-sm">
            <BrainCircuit className="w-4 h-4 text-brand-primary skew-x-12 mr-2" />
            <span className="skew-x-12 text-xs font-heading font-black tracking-widest text-brand-primary uppercase">
              Agentic Pipeline
            </span>
          </div>

          <h2 className="text-4xl lg:text-6xl font-heading font-black text-text-primary mb-4 flex flex-col items-start tracking-tighter uppercase leading-[1.08]">
            <span>Multi-Agent AI</span>
            <span className="text-text-muted mt-2">
              Pipeline for{' '}
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

          <p className="text-base md:text-lg text-text-secondary max-w-2xl mt-6 font-medium leading-relaxed">
            A standalone three-tier architecture that intercepts citizen reports, routes them through specialized AI agents, and synthesizes a quantifiable Priority Score.
          </p>

          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: "5rem" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="h-1.5 bg-brand-primary mt-6 -skew-x-12" 
          />
        </motion.div>

        {/* Animated Flowchart Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          className="w-full relative mt-8 mb-20"
        >
          {/* Outer parallelogram container (Frosted Glass) */}
          <div 
            className="w-full h-[520px] md:h-[540px] border-2 border-border-subtle md:-skew-x-12 relative overflow-hidden shadow-2xl rounded-2xl md:rounded-none"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--theme-surface) 35%, transparent)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)'
            }}
          >
            {/* Subtle grid background inside the parallelogram */}
            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none md:skew-x-12 scale-150" />
            
            {/* Dynamic Moving Circuit Data Lines */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25 md:skew-x-12">
              <svg className="w-full h-full min-w-[900px]" xmlns="http://www.w3.org/2000/svg">
                <motion.line 
                  x1="0%" y1="18%" x2="100%" y2="18%" 
                  stroke="var(--color-brand-primary)" strokeWidth="1.5" strokeDasharray="16 28"
                  animate={{ strokeDashoffset: [0, -200] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                <motion.line 
                  x1="0%" y1="50%" x2="100%" y2="50%" 
                  stroke="var(--color-brand-primary)" strokeWidth="1" strokeDasharray="24 40"
                  animate={{ strokeDashoffset: [0, 200] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  opacity="0.5"
                />
                <motion.line 
                  x1="0%" y1="82%" x2="100%" y2="82%" 
                  stroke="var(--color-brand-primary)" strokeWidth="1.5" strokeDasharray="16 28"
                  animate={{ strokeDashoffset: [0, 200] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
              </svg>
            </div>

            {/* Ambient Glows */}
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none md:skew-x-12" />
            <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-[#10b981]/10 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none md:skew-x-12" />
            
            {/* Unskewed content wrapper with horizontal scrolling for smaller screens */}
            <div className="md:skew-x-12 w-full h-full flex items-center overflow-x-auto overflow-y-visible px-4 md:px-16 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="min-w-[920px] w-full h-[440px] flex items-center justify-between relative py-6">
                
                {/* ========================================================= */}
                {/* AUTHENTIC PIPELINE CONNECTION SVG GRAPH                   */}
                {/* ========================================================= */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1000 440" preserveAspectRatio="none">
                  <defs>
                    {/* UserSpaceOnUse ensures the gradient renders properly even on zero-height horizontal lines */}
                    <linearGradient id="pipelineGrad" gradientUnits="userSpaceOnUse" x1="50" y1="220" x2="970" y2="220">
                      <stop offset="0%" stopColor="#3F72AF" stopOpacity="0.6" />
                      <stop offset="25%" stopColor="#60A5FA" stopOpacity="0.85" />
                      <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.9" />
                      <stop offset="75%" stopColor="#10B981" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.9" />
                    </linearGradient>

                    <filter id="packetGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Subtle ambient continuous path underlay */}
                  <path 
                    d={PATH_UPPER} 
                    fill="none" 
                    stroke="rgba(96, 165, 250, 0.2)" 
                    strokeWidth="1.5" 
                  />
                  <path 
                    d={PATH_LOWER} 
                    fill="none" 
                    stroke="rgba(56, 189, 248, 0.2)" 
                    strokeWidth="1.5" 
                  />

                  {/* Branch 1: Citizen Report -> Vision Triage */}
                  <path 
                    d="M 50,220 C 150,220 180,105 280,105" 
                    fill="none" 
                    stroke="url(#pipelineGrad)" 
                    strokeWidth="2.5" 
                    strokeDasharray="6 6"
                    className="opacity-80"
                  />

                  {/* Branch 2: Citizen Report -> Meteorological Agent */}
                  <path 
                    d="M 50,220 C 150,220 180,335 280,335" 
                    fill="none" 
                    stroke="url(#pipelineGrad)" 
                    strokeWidth="2.5" 
                    strokeDasharray="6 6"
                    className="opacity-80"
                  />

                  {/* Branch 3: Vision Triage -> Synthesis Engine */}
                  <path 
                    d="M 290,105 C 390,105 415,220 505,220" 
                    fill="none" 
                    stroke="url(#pipelineGrad)" 
                    strokeWidth="2.5" 
                    strokeDasharray="6 6"
                    className="opacity-80"
                  />

                  {/* Branch 4: Meteorological Agent -> Synthesis Engine */}
                  <path 
                    d="M 290,335 C 390,335 415,220 505,220" 
                    fill="none" 
                    stroke="url(#pipelineGrad)" 
                    strokeWidth="2.5" 
                    strokeDasharray="6 6"
                    className="opacity-80"
                  />

                  {/* Trunk: Synthesis Engine -> Supabase -> LGU Dispatch (All the way to 970) */}
                  <path 
                    d="M 505,220 L 725,220 L 970,220" 
                    fill="none" 
                    stroke="url(#pipelineGrad)" 
                    strokeWidth="2.5" 
                    strokeDasharray="6 6"
                    className="opacity-90"
                  />

                  {/* Packet 1: Vision Route (Blue) */}
                  <circle r="4.5" fill="#60A5FA" filter="url(#packetGlow)">
                    <animateMotion
                      path={PATH_UPPER}
                      dur="4.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;1;1;0"
                      keyTimes="0;0.05;0.94;0.99;1"
                      dur="4.5s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Packet 2: Meteorology Route (Cyan) */}
                  <circle r="4.5" fill="#38BDF8" filter="url(#packetGlow)">
                    <animateMotion
                      path={PATH_LOWER}
                      dur="4.5s"
                      begin="1.12s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;1;1;0"
                      keyTimes="0;0.05;0.94;0.99;1"
                      dur="4.5s"
                      begin="1.12s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Packet 3: Synthesis Wave (Amber) */}
                  <circle r="4.5" fill="#F59E0B" filter="url(#packetGlow)">
                    <animateMotion
                      path={PATH_UPPER}
                      dur="4.5s"
                      begin="2.25s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;1;1;0"
                      keyTimes="0;0.05;0.94;0.99;1"
                      dur="4.5s"
                      begin="2.25s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* Packet 4: Dispatch Wave (Emerald) */}
                  <circle r="4.5" fill="#10B981" filter="url(#packetGlow)">
                    <animateMotion
                      path={PATH_LOWER}
                      dur="4.5s"
                      begin="3.37s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;1;1;0"
                      keyTimes="0;0.05;0.94;0.99;1"
                      dur="4.5s"
                      begin="3.37s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>

                {/* Node 1: Citizen Report (Left) */}
                <SharpNode 
                  icon={<Camera />} 
                  label="Citizen Report" 
                  sublabel="Geotagged Photo"
                  borderColor="border-border-subtle group-hover:border-text-primary"
                  iconColor="text-text-primary"
                  bgColor="bg-surface-subtle"
                  delay={0.1}
                />
                
                {/* Node 2: Multi-Agent Parallel Stack (Vertical) */}
                <div className="flex flex-col gap-10 z-10">
                  <SharpNode 
                    icon={<Sparkles />} 
                    label="Vision Triage" 
                    sublabel="Gemini 1.5 Flash"
                    borderColor="border-brand-primary/40 group-hover:border-brand-primary"
                    iconColor="text-brand-primary"
                    bgColor="bg-brand-primary/10"
                    delay={0.3}
                  />
                  <SharpNode 
                    icon={<CloudRain />} 
                    label="Meteorological" 
                    sublabel="Open-Meteo API"
                    borderColor="border-[#38bdf8]/40 group-hover:border-[#38bdf8]"
                    iconColor="text-[#38bdf8]"
                    bgColor="bg-[#38bdf8]/10"
                    delay={0.5}
                  />
                </div>

                {/* Node 3: Synthesis Engine (Center) */}
                <SharpNode 
                  icon={<BrainCircuit />} 
                  label="Synthesis Engine" 
                  sublabel="Priority Score"
                  borderColor="border-[#f59e0b]/40 group-hover:border-[#f59e0b]"
                  iconColor="text-[#f59e0b]"
                  bgColor="bg-[#f59e0b]/10"
                  delay={0.7}
                />

                {/* Node 4: Supabase Database */}
                <SharpNode 
                  icon={<Database />} 
                  label="Supabase" 
                  sublabel="PostgreSQL / RLS"
                  borderColor="border-[#10b981]/40 group-hover:border-[#10b981]"
                  iconColor="text-[#10b981]"
                  bgColor="bg-[#10b981]/10"
                  delay={0.9}
                />

                {/* Node 5: LGU Dispatch (Right) */}
                <SharpNode 
                  icon={<MonitorDot />} 
                  label="LGU Dispatch" 
                  sublabel="Live Map Queue"
                  borderColor="border-border-subtle group-hover:border-text-primary"
                  iconColor="text-text-primary"
                  bgColor="bg-surface-subtle"
                  delay={1.1}
                />

              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Bento Boxes (Parallelogram Frosted Glass) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div 
              className="group border-2 border-border-subtle hover:border-brand-primary transition-all duration-300 p-6 md:p-8 md:-skew-x-12 relative overflow-hidden h-full rounded-2xl md:rounded-none shadow-sm hover:shadow-xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--theme-surface) 35%, transparent)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)'
              }}
            >
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none scale-150" />
              <div className="md:skew-x-12 h-full flex flex-col justify-center">
                <div className="w-12 h-12 bg-brand-primary/10 border-2 border-brand-primary/20 flex items-center justify-center mb-6">
                  <Sparkles className="w-5 h-5 text-brand-primary" />
                </div>
                <h3 className="text-xl font-heading font-black text-text-primary uppercase tracking-tight mb-2">Multimodal Vision</h3>
                <p className="text-text-secondary leading-relaxed text-sm md:text-base">
                  Uses Google Gemini 1.5 Flash to automatically classify blockage severity and identify specific waste types (plastics, silt) directly from photos without human review.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div 
              className="group border-2 border-border-subtle hover:border-[#38bdf8] transition-all duration-300 p-6 md:p-8 md:-skew-x-12 relative overflow-hidden h-full rounded-2xl md:rounded-none shadow-sm hover:shadow-xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--theme-surface) 35%, transparent)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)'
              }}
            >
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none scale-150" />
              <div className="md:skew-x-12 h-full flex flex-col justify-center">
                <div className="w-12 h-12 bg-[#38bdf8]/10 border-2 border-[#38bdf8]/20 flex items-center justify-center mb-6">
                  <CloudRain className="w-5 h-5 text-[#38bdf8]" />
                </div>
                <h3 className="text-xl font-heading font-black text-text-primary uppercase tracking-tight mb-2">Weather Synthesis</h3>
                <p className="text-text-secondary leading-relaxed text-sm md:text-base">
                  Cross-references Open-Meteo's 48-hour precipitation data. The Synthesis Engine calculates a 60/40 weighted Priority Score combining physical severity and imminent rain risk.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

      </motion.div>
    </section>
  );
}
