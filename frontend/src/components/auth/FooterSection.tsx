import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <circle cx="12" cy="10" r="3" />
    <path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

type LegalDoc = 'Terms of Service' | 'Privacy Policy' | 'Cookie Policy' | null;

const legalContent = {
  'Terms of Service': "Welcome to esteRoute. By using this platform, you agree to these Terms of Service. This platform is built as an academic prototype. You agree not to misuse the content, disrupt the services, or attempt to exploit any vulnerabilities in the system. The platform is provided 'as is' without warranties of any kind. We reserve the right to modify or terminate the service at any time.",
  'Privacy Policy': "We value your privacy. Your data (such as photos and GPS coordinates) is stored securely in our database solely to provide triage analysis. We do not sell your personal data to third parties. If you wish to have your data completely removed, please contact the administrators.",
  'Cookie Policy': "esteRoute uses minimal cookies strictly necessary for the platform to function properly. We use cookies to save your theme preferences and remember your session state. We do not use third-party tracking or advertising cookies."
};

export default function FooterSection() {
  const [activeDoc, setActiveDoc] = useState<LegalDoc>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeDoc) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeDoc]);

  return (
    <footer id="footer" className="bg-surface-subtle py-8 border-t-2 border-border-subtle overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-8">

        {/* Brand & Text (Left) */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          <div className="flex-shrink-0 cursor-default">
            {/* Text Logo Replacement */}
            <div className="font-heading font-black text-2xl tracking-tighter uppercase text-brand-primary -skew-x-12 border-2 border-brand-primary/20 bg-surface px-4 py-1">
              <span className="skew-x-12 block">esteRoute</span>
            </div>
          </div>

          <div className="h-12 w-[2px] bg-border-subtle hidden md:block"></div>

          <div className="flex flex-col">
            <p className="text-sm font-medium text-text-secondary leading-relaxed">
              The ultimate open-source urban drainage triage platform.
            </p>
            <p className="text-[11px] font-bold text-text-muted mt-2 tracking-widest uppercase">
              © 2026 esteRoute SD3 Project. All rights reserved.
            </p>
          </div>
        </div>

        {/* Socials (Right) */}
        <div className="flex items-center gap-4">
          {/* Dev Journal Icon */}
          <a
            href="https://goldenavs-dev-journal.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-brand-primary/10 text-brand-primary border-2 border-brand-primary/30 hover:bg-brand-primary hover:text-brand-white transition-all duration-300 hover:-translate-y-1 relative group cursor-pointer -skew-x-12"
            aria-label="Dev Journal"
          >
            <div className="skew-x-12">
              <UserIcon className="w-5 h-5" />
            </div>
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-surface border-2 border-border-subtle text-[10px] font-heading font-black tracking-widest uppercase text-text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl skew-x-12">
              Meet the Dev
            </span>
          </a>

          <div className="h-8 w-[2px] bg-border-subtle mx-2"></div>

          {/* GitHub Icon */}
          <a
            href="https://github.com/Goldenavs"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-surface border-2 border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-primary hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer -skew-x-12"
            aria-label="GitHub"
          >
            <div className="skew-x-12">
              <GithubIcon className="w-5 h-5" />
            </div>
          </a>
        </div>
      </div>

      {/* Legal & Community Note */}
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-16 mt-8 flex flex-col md:flex-row justify-between items-center gap-6">

        {/* Legal Links */}
        <div className="flex items-center gap-6 text-xs font-heading font-black uppercase tracking-widest text-text-secondary">
          {(['Terms of Service', 'Privacy Policy', 'Cookie Policy'] as LegalDoc[]).map(doc => (
            <button
              key={doc!}
              onClick={() => setActiveDoc(doc)}
              className="hover:text-brand-primary transition-colors focus:outline-none cursor-pointer"
            >
              {doc}
            </button>
          ))}
        </div>

        {/* Community Note */}
        <div className="flex items-center gap-2 text-[11px] font-heading font-black uppercase tracking-widest text-text-secondary">
          <span>Built with passion for the</span>
          <span className="inline-flex items-center justify-center w-4 h-4 overflow-hidden border border-border-subtle -skew-x-12">
            {/* Simple Philippine Flag representation inside parallelogram */}
            <div className="skew-x-12 w-full h-full flex items-center justify-center">
              <svg viewBox="0 0 64 64" className="w-full h-full">
                <rect width="64" height="32" fill="#0038A8" />
                <rect y="32" width="64" height="32" fill="#CE1126" />
                <polygon points="0,0 32,32 0,64" fill="#FFFFFF" />
                <circle cx="10" cy="32" r="3" fill="#FCD116" />
              </svg>
            </div>
          </span>
          <span>Community.</span>
        </div>
      </div>

      {/* Legal Modal Portal to document.body */}
      {createPortal(
        <AnimatePresence>
          {activeDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveDoc(null)}
                className="absolute inset-0 bg-app-bg/80 backdrop-blur-md cursor-pointer"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-surface border-2 border-border-subtle shadow-2xl overflow-hidden flex flex-col max-h-[80vh] -skew-x-3"
              >
                <div className="skew-x-3 h-full flex flex-col">
                  <div className="p-6 border-b-2 border-border-subtle flex items-center justify-between bg-surface-subtle">
                    <h3 className="text-xl font-heading font-black uppercase tracking-widest text-text-primary">{activeDoc}</h3>
                    <button
                      onClick={() => setActiveDoc(null)}
                      className="p-2 text-text-secondary hover:text-brand-primary transition-colors bg-surface border-2 border-border-subtle hover:border-brand-primary cursor-pointer -skew-x-12"
                    >
                      <div className="skew-x-12">
                        <CloseIcon className="w-5 h-5" />
                      </div>
                    </button>
                  </div>
                  <div className="p-8 text-base text-text-secondary leading-loose overflow-y-auto font-medium">
                    <p>{legalContent[activeDoc]}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </footer>
  );
}
