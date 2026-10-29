import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface Orb3DProps {
  variant?: 'orb' | 'ribbon';
  size?: number;
  className?: string;
}

export const Orb3D: React.FC<Orb3DProps> = ({
  variant = 'orb',
  size = 96,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (variant === 'ribbon') {
    return (
      <motion.div
        aria-hidden="true"
        animate={
          shouldReduceMotion
            ? undefined
            : { y: [0, -10, 0], rotate: [0, 4, -4, 0] }
        }
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: size, height: size }}
        className={`relative pointer-events-none select-none flex items-center justify-center ${className}`}
      >
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_14px_24px_rgba(2,132,199,0.32)]"
        >
          <defs>
            <linearGradient id="skyRibbonGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="30%" stopColor="#BAE6FD" />
              <stop offset="68%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="skyRibbonHighlight" x1="20" y1="10" x2="100" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
          </defs>
          {/* Bentuk Spiral 3D Sky Blue */}
          <path
            d="M32 30C32 18 88 18 88 32C88 46 32 42 32 58C32 74 88 70 88 86C88 100 42 102 36 92"
            stroke="url(#skyRibbonGrad)"
            strokeWidth="22"
            strokeLinecap="round"
          />
          <path
            d="M32 30C32 18 88 18 88 32C88 46 32 42 32 58C32 74 88 70 88 86"
            stroke="url(#skyRibbonHighlight)"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.65"
          />
          <circle cx="44" cy="24" r="5" fill="white" opacity="0.85" />
        </svg>
      </motion.div>
    );
  }

  return (
    <motion.div
      aria-hidden="true"
      animate={
        shouldReduceMotion
          ? undefined
          : { y: [0, -12, 0], rotate: [0, 4, -4, 0] }
      }
      transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: size, height: size }}
      className={`relative pointer-events-none select-none flex items-center justify-center ${className}`}
    >
      {/* Bola 3D Utama */}
      <div
        className="w-full h-full rounded-full shadow-float relative"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, #FFFFFF 0%, #BAE6FD 25%, #38BDF8 60%, #0369A1 100%)',
        }}
      >
        {/* Highlight Kilau Putih */}
        <div className="absolute top-[16%] left-[20%] w-[24%] h-[14%] rounded-full bg-white/80 blur-[1px] -rotate-25" />
      </div>

      {/* Cincin Orbit Kaca */}
      <div className="absolute -inset-1.5 rounded-full border-2 border-white/50 -rotate-12" />
    </motion.div>
  );
};

export default Orb3D;