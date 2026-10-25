import { useId } from 'react';
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
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm z-10">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3F72AF" stopOpacity="0" />
            <stop offset="50%" stopColor={color} stopOpacity="0.85" />
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
          stroke={`url(#${id})`}
          strokeWidth={borderWidth}
          strokeDasharray="140 1200"
          animate={{
            strokeDashoffset: [1340, 0],
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
