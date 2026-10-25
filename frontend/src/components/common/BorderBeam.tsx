import { useId, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export interface BorderBeamProps {
  delay?: number;
  color?: string;
  duration?: number;
  borderWidth?: number;
}

export default function BorderBeam({
  delay = 0,
  color = "#60A5FA",
  duration = 9,
  borderWidth = 2.5
}: BorderBeamProps) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [perimeter, setPerimeter] = useState<number>(1400);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth || 300;
        const h = containerRef.current.offsetHeight || 200;
        setPerimeter(Math.max(400, Math.round(2 * (w + h))));
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const beamLength = Math.max(120, Math.min(280, Math.round(perimeter * 0.18)));
  const gapLength = Math.max(100, perimeter - beamLength);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm z-10">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="50%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx="2"
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={borderWidth}
          strokeDasharray={`${beamLength} ${gapLength}`}
          animate={{
            strokeDashoffset: [perimeter, 0],
          }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </svg>
    </div>
  );
}
