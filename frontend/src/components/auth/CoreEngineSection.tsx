import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function CoreEngineSection() {
  const ref = useRef<HTMLElement>(null);
  
  // Parallax effect for the inner content
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
      className="relative z-20 bg-surface flex flex-col items-center justify-center overflow-hidden border-border-subtle"
      style={{
        clipPath: 'polygon(0 5vw, 100% 0, 100% 100%, 0 calc(100% - 5vw))',
        marginTop: '-5vw',
        marginBottom: '-5vw',
        paddingTop: 'calc(5vw + 6rem)',
        paddingBottom: 'calc(5vw + 6rem)',
        minHeight: '100vh'
      }}
    >
      <motion.div style={{ y, opacity }} className="w-full max-w-7xl mx-auto px-8 flex flex-col items-center justify-center relative z-0">
        <h2 className="text-3xl md:text-5xl font-heading font-black mb-6 text-text-primary text-center uppercase tracking-tighter">Core Engine Section</h2>
        <p className="text-text-secondary">Placeholder for Core Engine (A* Algorithm & Dispatch logic)...</p>
      </motion.div>
    </section>
  );
}
