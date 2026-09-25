import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Camera, Sparkles, CloudRain, BrainCircuit, Database, MonitorDot, ArrowRight } from 'lucide-react';

const ScrollWriteText = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 85%", "end 50%"]
  });
  
  const clipPath = useTransform(scrollYProgress, [0, 1], ["inset(-100% 100% -100% -100%)", "inset(-100% -100% -100% -100%)"]);

  return (
    <motion.div
      ref={ref}
      style={{ clipPath }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
};

const SharpNode = ({ icon, label, sublabel, borderColor, iconColor, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
    className="flex flex-col items-center z-10 relative group"
  >
    <div className={`w-20 h-20 md:w-28 md:h-28 -skew-x-12 border-2 bg-surface flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-xl ${borderColor}`}>
      <div className={`skew-x-12 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full transition-transform duration-300 transform group-hover:scale-110 ${iconColor}`}>
        {icon}
      </div>
    </div>
    <div className={`mt-6 px-4 py-2 border-2 -skew-x-12 bg-surface text-[10px] md:text-xs font-heading font-black tracking-widest uppercase shadow-md transition-colors ${borderColor}`}>
      <div className="skew-x-12 flex flex-col items-center text-text-primary">
        <span>{label}</span>
        {sublabel && <span className="text-[9px] text-brand-primary mt-1">{sublabel}</span>}
      </div>
    </div>
  </motion.div>
);

export default function CoreEngineSection() {
  const ref = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["end end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  return (
    <section 
      id="core-engine" 
      ref={ref}
      className="relative z-20 bg-surface flex flex-col items-center overflow-hidden border-border-subtle"
      style={{
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
          <div className="inline-flex items-center justify-center px-4 py-2 bg-brand-primary/10 border-2 border-brand-primary/20 -skew-x-12 mb-6">
            <BrainCircuit className="w-4 h-4 text-brand-primary skew-x-12 mr-2" />
            <span className="skew-x-12 text-xs font-heading font-black tracking-widest text-brand-primary uppercase">Agentic Pipeline</span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-heading font-black text-text-primary mb-4 flex flex-col items-start tracking-tighter uppercase">
            <ScrollWriteText>Multi-Agent AI</ScrollWriteText>
            <ScrollWriteText className="text-text-muted mt-2">Orchestration.</ScrollWriteText>
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mt-6 font-medium leading-relaxed">
            A standalone three-tier architecture that intercepts citizen reports, routes them through specialized AI agents, and synthesizes a quantifiable Priority Score.
          </p>
        </motion.div>

        {/* Animated Flowchart */}
        <div className="w-full relative mt-12 py-12 mb-20 overflow-x-auto overflow-y-visible custom-scrollbar">
          <div className="min-w-[900px] w-full flex items-center justify-between relative px-8">
            
            {/* Animated Dashed Line */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <line x1="10%" y1="35%" x2="90%" y2="35%" stroke="var(--color-brand-primary)" strokeWidth="2" strokeDasharray="8 8" className="opacity-30" />
              {/* Particles Flowing */}
              {[0, 1.5, 3].map((delay, i) => (
                <motion.circle
                  key={`particle-${i}`}
                  cx="0" cy="35%" r="4" fill="var(--color-brand-primary)"
                  animate={{ cx: ["10%", "90%"], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear", delay }}
                />
              ))}
            </svg>

            {/* Nodes */}
            <SharpNode 
              icon={<Camera />} 
              label="Citizen Report" 
              sublabel="Geotagged Photo"
              borderColor="border-border-subtle group-hover:border-text-primary"
              iconColor="text-text-primary"
              delay={0.1}
            />
            
            {/* Multi-Agent Stack (Vertical) */}
            <div className="flex flex-col gap-8 z-10">
              <SharpNode 
                icon={<Sparkles />} 
                label="Vision Triage" 
                sublabel="Gemini 1.5 Flash"
                borderColor="border-brand-primary/40 group-hover:border-brand-primary"
                iconColor="text-brand-primary"
                delay={0.3}
              />
              <SharpNode 
                icon={<CloudRain />} 
                label="Meteorological" 
                sublabel="Open-Meteo API"
                borderColor="border-[#38bdf8]/40 group-hover:border-[#38bdf8]"
                iconColor="text-[#38bdf8]"
                delay={0.5}
              />
            </div>

            <SharpNode 
              icon={<BrainCircuit />} 
              label="Synthesis Engine" 
              sublabel="Priority Score"
              borderColor="border-[#f59e0b]/40 group-hover:border-[#f59e0b]"
              iconColor="text-[#f59e0b]"
              delay={0.7}
            />

            <SharpNode 
              icon={<Database />} 
              label="Supabase" 
              sublabel="PostgreSQL / RLS"
              borderColor="border-[#10b981]/40 group-hover:border-[#10b981]"
              iconColor="text-[#10b981]"
              delay={0.9}
            />

            <SharpNode 
              icon={<MonitorDot />} 
              label="LGU Dispatch" 
              sublabel="Live Map Queue"
              borderColor="border-border-subtle group-hover:border-text-primary"
              iconColor="text-text-primary"
              delay={1.1}
            />

          </div>
        </div>

        {/* Feature Bento Boxes (Parallelogram) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="group bg-app-bg border-2 border-border-subtle hover:border-brand-primary transition-all duration-300 p-8 -skew-x-12 relative overflow-hidden h-full">
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none scale-150" />
              <div className="skew-x-12 h-full flex flex-col justify-center">
                <div className="w-12 h-12 bg-brand-primary/10 border-2 border-brand-primary/20 flex items-center justify-center mb-6">
                  <Sparkles className="w-5 h-5 text-brand-primary" />
                </div>
                <h3 className="text-xl font-heading font-black text-text-primary uppercase tracking-tight mb-2">Multimodal Vision</h3>
                <p className="text-text-secondary leading-relaxed">
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
            <div className="group bg-app-bg border-2 border-border-subtle hover:border-[#38bdf8] transition-all duration-300 p-8 -skew-x-12 relative overflow-hidden h-full">
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none scale-150" />
              <div className="skew-x-12 h-full flex flex-col justify-center">
                <div className="w-12 h-12 bg-[#38bdf8]/10 border-2 border-[#38bdf8]/20 flex items-center justify-center mb-6">
                  <CloudRain className="w-5 h-5 text-[#38bdf8]" />
                </div>
                <h3 className="text-xl font-heading font-black text-text-primary uppercase tracking-tight mb-2">Weather Synthesis</h3>
                <p className="text-text-secondary leading-relaxed">
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
