import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';

const faqCategories: Record<string, {q: string, a: string}[]> = {
  "General": [
    {
      q: "What exactly is esteRoute?",
      a: "esteRoute is a web-based autonomous triage and dispatch platform designed for urban drainage blockage mitigation. It connects citizen reports directly to local government sanitation units using AI-driven prioritization."
    },
    {
      q: "Who is this platform built for?",
      a: "It serves two primary users: Citizen Reporters (like sari-sari store owners in flood-prone barangays) who submit blockage photos, and LGU Dispatchers (Sanitation Officers) who manage the prioritized tasks."
    },
    {
      q: "Do I need an account to report a blockage?",
      a: "No! Citizen Reporters can submit a geotagged photo, adjust their GPS pin, and add an optional note completely anonymously, without requiring account registration."
    }
  ],
  "Tech & AI Pipeline": [
    {
      q: "How does the Vision Triage Agent work?",
      a: "When a photo is uploaded, our Vision Triage Agent (powered by Google Gemini 1.5 Flash multimodal) automatically estimates the percentage of the waterway obstructed and identifies waste categories (like plastics or silt) without manual human review."
    },
    {
      q: "How does weather affect prioritization?",
      a: "The Meteorological Agent cross-references the report's GPS location with Open-Meteo's API to fetch the next 48-hour precipitation probability. Imminent rain significantly increases the urgency of a blockage."
    },
    {
      q: "How is the final Priority Score calculated?",
      a: "The Dispatch Synthesis Engine computes a final Priority Score weighted 60% on physical blockage severity (directly observed) and 40% on rain probability (forward-looking urgency multiplier)."
    }
  ],
  "Security & Setup": [
    {
      q: "Is my personal data and location secure?",
      a: "Yes. esteRoute runs on a highly secure Supabase PostgreSQL architecture utilizing strict Row Level Security (RLS) policies. Only the backend service-role key has write privileges, keeping data tamper-proof."
    },
    {
      q: "Does this platform cost anything for the LGU?",
      a: "As a functional prototype, esteRoute is designed to operate entirely within the free tiers of Supabase, Google Gemini, and Open-Meteo, proving that high-end civic AI tools can be built at zero recurring monetary cost."
    }
  ]
};

const categoryNames = Object.keys(faqCategories);

// Subtle, eye-friendly traveling perimeter highlight
const BorderBeam = ({ delay = 0, color = "#60A5FA" }: { delay?: number; color?: string }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl md:rounded-none z-10">
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`faq-beam-${delay}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3F72AF" stopOpacity="0" />
          <stop offset="50%" stopColor={color} stopOpacity="0.8" />
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
        stroke={`url(#faq-beam-${delay})`}
        strokeWidth="2.5"
        strokeDasharray="120 1000"
        animate={{
          strokeDashoffset: [1120, 0],
        }}
        transition={{
          duration: 9,
          delay,
          repeat: Infinity,
          ease: "linear",
        }}
        className="opacity-25 group-hover:opacity-90 transition-opacity duration-500"
      />
    </svg>
  </div>
);

export default function FaqsSection() {
  const [activeCategory, setActiveCategory] = useState<string>(categoryNames[0]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Dynamic header cycling word (cycles every 3 seconds)
  const [headerWordIndex, setHeaderWordIndex] = useState(0);
  const headerWords = ['Platform.', 'Security.', 'Dispatch.'];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeaderWordIndex((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const activeFaqs = faqCategories[activeCategory];

  const ref = React.useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0px", "150px"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.5]);

  return (
    <motion.section 
      ref={ref}
      style={{ y, opacity }}
      id="faqs" 
      className="pt-24 pb-48 md:pb-64 px-6 lg:px-16 bg-transparent relative z-10 overflow-hidden"
    >
      <div className="w-full max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16"
        >
          <div className="inline-flex items-center justify-center px-4 py-2 bg-brand-primary/10 border-2 border-brand-primary/20 -skew-x-12 mb-6 backdrop-blur-sm">
            <MessageCircleQuestion className="w-4 h-4 text-brand-primary skew-x-12 mr-2" />
            <span className="skew-x-12 text-xs font-heading font-black tracking-widest text-brand-primary uppercase">Knowledge Base</span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-heading font-black text-text-primary mb-4 flex flex-col items-start tracking-tighter uppercase leading-[1.08]">
            <span>Frequently Asked</span>
            <span className="text-text-muted mt-2">
              Questions on{' '}
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
            Everything you need to know about the autonomous esteRoute triage and dispatch&nbsp;pipeline.
          </p>
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: "5rem" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="h-1.5 bg-brand-primary mt-6 -skew-x-12" 
          />
        </motion.div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-start gap-4 mb-12">
          {categoryNames.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setOpenIndex(0); // auto-open first item on switch
                }}
                className={`relative px-4 md:px-8 py-3 md:-skew-x-12 border-2 rounded-xl md:rounded-none transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? 'border-brand-primary bg-brand-primary text-app-bg shadow-md' 
                    : 'border-border-subtle text-text-secondary hover:text-text-primary hover:border-brand-primary bg-surface/20 hover:bg-surface/85 hover:backdrop-blur-xl'
                }`}
              >
                <span className="relative z-10 md:skew-x-12 block font-heading font-black uppercase tracking-widest text-xs md:text-sm">{cat}</span>
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion List */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {activeFaqs.map((faq, i) => {
                const isOpen = openIndex === i;
                return (
                  <motion.div 
                    key={i}
                    className={`group relative border-2 rounded-xl md:rounded-none transition-all duration-500 md:-skew-x-12 overflow-hidden ${
                      isOpen 
                        ? 'bg-surface/85 backdrop-blur-xl border-brand-primary shadow-lg' 
                        : 'bg-surface/20 hover:bg-surface/85 hover:backdrop-blur-xl border-border-subtle hover:border-brand-primary shadow-sm hover:shadow-xl'
                    }`}
                  >
                    {/* Perimeter running light */}
                    <BorderBeam delay={(i % 4) * 1.5} color={isOpen ? "#60A5FA" : "#3F72AF"} />

                    <div className="md:skew-x-12 relative z-10">
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : i)}
                        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none cursor-pointer"
                      >
                        <span className={`font-heading font-black text-base md:text-lg pr-8 uppercase tracking-wide transition-colors ${isOpen ? 'text-brand-primary' : 'text-text-primary group-hover:text-brand-primary'}`}>
                          {faq.q}
                        </span>
                        <div className={`w-8 h-8 flex items-center justify-center border-2 transition-all duration-300 ${isOpen ? 'border-brand-primary bg-brand-primary text-brand-white' : 'border-border-subtle text-text-secondary group-hover:border-brand-primary group-hover:text-brand-primary'}`}>
                          <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                          >
                            <div className="px-6 pb-6 text-text-secondary text-sm md:text-base leading-relaxed border-t-2 border-border-subtle/50 pt-5 mt-2 font-medium">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>


      </div>
    </motion.section>
  );
}
