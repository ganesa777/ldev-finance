import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const AnimatedBackground: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#F0F9FF] via-[#E0F2FE] to-[#F8FAFC]"
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Blob 1: Kiri Atas — Radial Gradient murni (Tanpa beban CSS Filter Blur berat di GPU HP) */}
      <motion.div
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, 40, -20, 0],
                y: [0, 30, -15, 0],
                scale: [1, 1.06, 0.96, 1],
              }
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background:
            'radial-gradient(circle, rgba(56,189,248,0.28) 0%, rgba(56,189,248,0.08) 45%, rgba(56,189,248,0) 72%)',
        }}
        className="absolute -top-32 -left-32 w-[460px] h-[460px] rounded-full will-change-transform"
      />

      {/* Blob 2: Kanan Tengah */}
      <motion.div
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, -35, 25, 0],
                y: [0, 40, -25, 0],
                scale: [1, 0.95, 1.05, 1],
              }
        }
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background:
            'radial-gradient(circle, rgba(14,165,233,0.22) 0%, rgba(14,165,233,0.06) 45%, rgba(14,165,233,0) 72%)',
        }}
        className="absolute top-1/4 -right-36 w-[500px] h-[500px] rounded-full will-change-transform"
      />

      {/* Blob 3: Bawah Tengah */}
      <motion.div
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, 25, -30, 0],
                y: [0, -30, 20, 0],
                scale: [1, 1.05, 0.96, 1],
              }
        }
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background:
            'radial-gradient(circle, rgba(125,211,252,0.30) 0%, rgba(125,211,252,0.08) 45%, rgba(125,211,252,0) 72%)',
        }}
        className="absolute -bottom-40 left-1/4 w-[520px] h-[520px] rounded-full will-change-transform"
      />
    </div>
  );
};

export default AnimatedBackground;