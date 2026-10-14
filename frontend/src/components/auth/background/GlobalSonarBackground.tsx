import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';

export default function GlobalSonarBackground() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      containerRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
      containerRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
      containerRef.current.style.setProperty('--spotlight-opacity', '1');
    };

    const handlePointerLeave = () => {
      if (!containerRef.current) return;
      containerRef.current.style.setProperty('--spotlight-opacity', '0');
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.body.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.body.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  const strokeColor = isLight ? '#3F72AF' : '#60A5FA';
  const dotColor = isLight ? '#112D4E' : '#3F72AF';

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        // Default initial coordinates off-screen
        ['--mouse-x' as string]: '-1000px',
        ['--mouse-y' as string]: '-1000px',
        ['--spotlight-opacity' as string]: '0',
      }}
    >
      {/* ========================================================= */}
      {/* LAYER 1: Technical Engineering Dot Grid (Base Ambient)    */}
      {/* ========================================================= */}
      <div 
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: isLight ? 0.08 : 0.12,
          backgroundImage: `radial-gradient(${dotColor} 1.2px, transparent 1.2px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ========================================================= */}
      {/* LAYER 2: Drifting Topographic / Bathymetric Contour Lines  */}
      {/* ========================================================= */}
      <div className="absolute inset-0 opacity-70">
        <svg 
          className="w-full h-full min-w-[1200px] min-h-[900px]" 
          viewBox="0 0 1600 1200" 
          preserveAspectRatio="none"
          fill="none"
        >
          {/* Wave group A: Noticeably drifting natural elevation curves */}
          <motion.g
            animate={{
              x: [0, 90, -60, 0],
              y: [0, -50, 35, 0],
              scale: [1, 1.03, 0.98, 1],
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            stroke={strokeColor}
            strokeWidth="1.4"
            opacity={isLight ? 0.22 : 0.32}
          >
            <path d="M-200,120 C200,40 500,240 950,150 S1450,40 1900,180" />
            <path d="M-200,280 C150,190 550,400 1000,290 S1500,190 1900,340" />
            <path d="M-200,450 C240,360 450,560 960,460 S1550,360 1900,520" />
            <path d="M-200,620 C160,530 580,720 1050,620 S1480,520 1900,690" />
            <path d="M-200,800 C260,700 480,900 980,810 S1520,700 1900,860" />
            <path d="M-200,980 C180,880 600,1060 1080,970 S1500,860 1900,1040" />
          </motion.g>

          {/* Wave group B: Counter-flowing micro bathymetric currents with flowing dashes */}
          <motion.g
            animate={{
              x: [0, -70, 50, 0],
              y: [0, 40, -30, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            stroke={strokeColor}
            strokeWidth="1.0"
            strokeDasharray="10 10"
            opacity={isLight ? 0.16 : 0.26}
          >
            <motion.path 
              animate={{ strokeDashoffset: [0, -200] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              d="M-200,200 C300,100 650,320 1100,220 S1600,100 1900,260" 
            />
            <motion.path 
              animate={{ strokeDashoffset: [0, -200] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              d="M-200,530 C200,430 620,630 1080,530 S1560,430 1900,590" 
            />
            <motion.path 
              animate={{ strokeDashoffset: [0, -200] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              d="M-200,890 C320,780 680,980 1150,880 S1620,770 1900,940" 
            />
          </motion.g>
        </svg>
      </div>

      {/* ========================================================= */}
      {/* LAYER 3: Interactive Cursor Sonar Spotlight (Radial Glow) */}
      {/* ========================================================= */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: 'var(--spotlight-opacity)',
          background: isLight
            ? `radial-gradient(750px circle at var(--mouse-x) var(--mouse-y), rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.06) 45%, transparent 75%)`
            : `radial-gradient(750px circle at var(--mouse-x) var(--mouse-y), rgba(59, 130, 246, 0.25), rgba(30, 58, 138, 0.1) 50%, transparent 80%)`,
        }}
      />

      {/* ========================================================= */}
      {/* LAYER 4: Sonar Scan Reveal (High-Definition Cursor Ring)  */}
      {/* ========================================================= */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: 'var(--spotlight-opacity)',
          maskImage: `radial-gradient(420px circle at var(--mouse-x) var(--mouse-y), black 20%, transparent 75%)`,
          WebkitMaskImage: `radial-gradient(420px circle at var(--mouse-x) var(--mouse-y), black 20%, transparent 75%)`,
        }}
      >
        {/* Luminous high-contrast grid under the cursor */}
        <div 
          className="absolute inset-0"
          style={{
            opacity: isLight ? 0.45 : 0.55,
            backgroundImage: `radial-gradient(${strokeColor} 1.6px, transparent 1.6px)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Luminous animated contour curves illuminated by cursor */}
        <svg 
          className="w-full h-full min-w-[1200px] min-h-[900px]" 
          viewBox="0 0 1600 1200" 
          preserveAspectRatio="none"
          fill="none"
        >
          <motion.g 
            animate={{
              x: [0, 90, -60, 0],
              y: [0, -50, 35, 0],
              scale: [1, 1.03, 0.98, 1],
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            stroke="#3B82F6" 
            strokeWidth="2.0" 
            opacity={isLight ? 0.6 : 0.8}
          >
            <path d="M-200,120 C200,40 500,240 950,150 S1450,40 1900,180" />
            <path d="M-200,280 C150,190 550,400 1000,290 S1500,190 1900,340" />
            <path d="M-200,450 C240,360 450,560 960,460 S1550,360 1900,520" />
            <path d="M-200,620 C160,530 580,720 1050,620 S1480,520 1900,690" />
            <path d="M-200,800 C260,700 480,900 980,810 S1520,700 1900,860" />
            <path d="M-200,980 C180,880 600,1060 1080,970 S1500,860 1900,1040" />
          </motion.g>

          <motion.g
            animate={{
              x: [0, -70, 50, 0],
              y: [0, 40, -30, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            stroke="#60A5FA"
            strokeWidth="1.4"
            strokeDasharray="10 10"
            opacity={isLight ? 0.45 : 0.65}
          >
            <motion.path 
              animate={{ strokeDashoffset: [0, -200] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              d="M-200,200 C300,100 650,320 1100,220 S1600,100 1900,260" 
            />
            <motion.path 
              animate={{ strokeDashoffset: [0, -200] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              d="M-200,530 C200,430 620,630 1080,530 S1560,430 1900,590" 
            />
            <motion.path 
              animate={{ strokeDashoffset: [0, -200] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              d="M-200,890 C320,780 680,980 1150,880 S1620,770 1900,940" 
            />
          </motion.g>
        </svg>
      </div>
    </div>
  );
}
