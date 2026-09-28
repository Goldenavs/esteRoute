import React, { useRef } from 'react';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import { Camera, Sparkles, CloudRain, MonitorDot, Zap } from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
};

const ScrollWriteText = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 85%", "end 50%"]
  });
  
  // Maps 0->1 scroll to 100%->0% inset
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

export default function FeaturesSection() {
  const ref = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0px", "150px"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.5]);

  return (
    <motion.section 
      ref={ref}
      id="features" 
      style={{ y, opacity }}
      className="pt-24 pb-48 md:pb-64 px-6 lg:px-16 bg-app-bg relative overflow-hidden z-10"
    >
      <div className="w-full max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16"
        >
          <div className="inline-flex items-center justify-center px-4 py-2 bg-brand-primary/10 border-2 border-brand-primary/20 -skew-x-12 mb-6">
            <Zap className="w-4 h-4 text-brand-primary skew-x-12 mr-2" />
            <span className="skew-x-12 text-xs font-heading font-black tracking-widest text-brand-primary uppercase">Core Features</span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-heading font-black text-text-primary mb-4 flex flex-col items-start tracking-tighter uppercase">
            <ScrollWriteText>Triage infrastructure.</ScrollWriteText>
            <ScrollWriteText className="text-text-muted mt-2">Powered by AI.</ScrollWriteText>
          </h2>
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: "5rem" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="h-2 bg-brand-primary mt-6 -skew-x-12" 
          />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Feature 1: Citizen (2 cols) */}
          <motion.div variants={cardVariants} className="md:col-span-2">
            <div className="group relative bg-surface border-2 border-border-subtle hover:border-brand-primary transition-all duration-300 shadow-sm hover:shadow-xl md:-skew-x-12 p-6 md:p-8 h-full rounded-xl md:rounded-none">
              <div className="md:skew-x-12 h-full flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
                  <div className="shrink-0 w-14 h-14 bg-brand-primary/10 border-2 border-brand-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Camera className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-2xl text-text-primary mb-2 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                      Frictionless Citizen Reporting
                    </h3>
                    <p className="text-base text-text-secondary leading-relaxed font-medium">
                      Submit geotagged photos of canal blockages in seconds. No account required. The system automatically captures GPS coordinates and allows optional incident notes.
                    </p>
                  </div>
                </div>
                <div className="w-full h-32 bg-surface-subtle border-2 border-border-subtle flex items-center justify-center overflow-hidden relative group-hover:border-brand-primary/50 transition-colors">
                   <div className="absolute inset-0 opacity-20 bg-[url('/Auth/CitizenAuth.jpg')] bg-cover bg-center scale-110 group-hover:scale-125 transition-transform duration-700" />
                   <span className="font-heading font-black text-xl text-text-primary uppercase tracking-widest z-10 drop-shadow-lg">No App Install Needed</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature 2: Meteorological (1 col) */}
          <motion.div variants={cardVariants} className="md:col-span-1">
            <div className="group relative bg-surface border-2 border-border-subtle hover:border-brand-primary transition-all duration-300 shadow-sm hover:shadow-xl md:-skew-x-12 p-6 md:p-8 h-full rounded-xl md:rounded-none">
              <div className="md:skew-x-12 h-full flex flex-col justify-between">
                <div className="flex flex-col gap-6 items-start mb-8">
                  <div className="shrink-0 w-14 h-14 bg-brand-primary/10 border-2 border-brand-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <CloudRain className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-2xl text-text-primary mb-2 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                      Meteorological Agent
                    </h3>
                    <p className="text-base text-text-secondary leading-relaxed font-medium">
                      Cross-references 48-hour precipitation data via Open-Meteo. Computes rain probability index to preempt flash floods.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature 3: Vision AI (1 col) */}
          <motion.div variants={cardVariants} className="md:col-span-1">
            <div className="group relative bg-surface border-2 border-border-subtle hover:border-brand-primary transition-all duration-300 shadow-sm hover:shadow-xl md:-skew-x-12 p-6 md:p-8 h-full rounded-xl md:rounded-none">
              <div className="md:skew-x-12 h-full flex flex-col justify-between">
                <div className="flex flex-col gap-6 items-start mb-8">
                  <div className="shrink-0 w-14 h-14 bg-brand-primary border-2 border-brand-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-2xl text-text-primary mb-2 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                      Vision Triage Agent
                    </h3>
                    <p className="text-base text-text-secondary leading-relaxed font-medium">
                      Gemini 1.5 Flash multimodal AI classifies waste (plastics, silt, debris) and accurately estimates blockage severity from photos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature 4: Dispatch (2 cols) */}
          <motion.div variants={cardVariants} className="md:col-span-2">
            <div className="group relative bg-surface border-2 border-border-subtle hover:border-brand-primary transition-all duration-300 shadow-sm hover:shadow-xl md:-skew-x-12 p-6 md:p-8 h-full rounded-xl md:rounded-none">
              <div className="md:skew-x-12 h-full flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
                  <div className="shrink-0 w-14 h-14 bg-brand-primary/10 border-2 border-brand-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <MonitorDot className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-2xl text-text-primary mb-2 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                      LGU Dispatcher Dashboard
                    </h3>
                    <p className="text-base text-text-secondary leading-relaxed font-medium">
                      A live, color-coded map and priority queue for dispatchers. Effortlessly manage report status transitions from Pending to Resolved with robust timestamp logging.
                    </p>
                  </div>
                </div>
                 <div className="w-full h-32 bg-surface-subtle border-2 border-border-subtle flex items-center justify-center overflow-hidden relative group-hover:border-brand-primary/50 transition-colors">
                   <div className="absolute inset-0 opacity-20 bg-[url('/Auth/AdminAuth.jpg')] bg-cover bg-center scale-110 group-hover:scale-125 transition-transform duration-700" />
                   <span className="font-heading font-black text-xl text-text-primary uppercase tracking-widest z-10 drop-shadow-lg">Real-Time Priority Queue</span>
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </motion.section>
  );
}
