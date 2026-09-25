import React, { useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, Mail, MessageCircleQuestion } from 'lucide-react';

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

const ScrollWriteText = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const ref = React.useRef<HTMLDivElement>(null);
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

export default function FaqsSection() {
  const [activeCategory, setActiveCategory] = useState<string>(categoryNames[0]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const activeFaqs = faqCategories[activeCategory];

  return (
    <section id="faqs" className="py-24 px-6 lg:px-16 bg-app-bg relative z-10 overflow-hidden">
      <div className="w-full max-w-5xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center px-4 py-2 bg-brand-primary/10 border-2 border-brand-primary/20 -skew-x-12 mb-6">
            <MessageCircleQuestion className="w-4 h-4 text-brand-primary skew-x-12 mr-2" />
            <span className="skew-x-12 text-xs font-heading font-black tracking-widest text-brand-primary uppercase">Knowledge Base</span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-heading font-black text-text-primary mb-4 flex flex-col items-center justify-center uppercase tracking-tighter">
            <ScrollWriteText>Frequently Asked</ScrollWriteText>
            <ScrollWriteText className="text-brand-primary mt-2">Questions.</ScrollWriteText>
          </h2>
          <p className="text-lg text-text-secondary mt-6 font-medium">Everything you need to know about the esteRoute triage pipeline.</p>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categoryNames.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setOpenIndex(0); // auto-open first item on switch
                }}
                className={`relative px-8 py-3 -skew-x-12 border-2 transition-all duration-300 cursor-pointer ${
                  isActive ? 'border-brand-primary text-brand-white' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-primary bg-surface'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="faq-active-tab"
                    className="absolute inset-0 bg-brand-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <span className="relative z-10 skew-x-12 block font-heading font-black uppercase tracking-widest text-sm">{cat}</span>
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
                    className={`border-2 transition-colors duration-300 -skew-x-12 ${
                      isOpen ? 'bg-brand-primary/5 border-brand-primary' : 'bg-surface border-border-subtle hover:border-brand-primary/50'
                    }`}
                  >
                    <div className="skew-x-12">
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : i)}
                        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none cursor-pointer group"
                      >
                        <span className={`font-heading font-black text-base md:text-lg pr-8 uppercase tracking-wide transition-colors ${isOpen ? 'text-brand-primary' : 'text-text-primary group-hover:text-brand-primary'}`}>
                          {faq.q}
                        </span>
                        <div className={`w-8 h-8 flex items-center justify-center border-2 transition-all duration-300 ${isOpen ? 'border-brand-primary bg-brand-primary text-brand-white' : 'border-border-subtle text-text-secondary group-hover:border-brand-primary/50'}`}>
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
    </section>
  );
}
