import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function FaqsSection() {
  const ref = useRef<HTMLElement>(null);
  
  // Parallax effect
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["end end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  return (
    <section 
      id="faqs" 
      ref={ref}
      className="relative z-10 bg-app-bg flex flex-col items-center justify-center overflow-hidden border-t border-border-subtle"
      style={{
        paddingTop: 'calc(5vw + 6rem)',
        paddingBottom: '6rem',
        minHeight: '50vh'
      }}
    >
      <motion.div style={{ y, opacity }} className="w-full max-w-7xl mx-auto px-8 flex flex-col items-center justify-center relative z-0">
        <h2 className="text-3xl md:text-5xl font-heading font-black mb-6 text-brand-primary text-center uppercase tracking-tighter">FAQs Section</h2>
        <p className="text-text-secondary">Placeholder for Frequently Asked Questions...</p>
      </motion.div>
    </section>
  );
}
