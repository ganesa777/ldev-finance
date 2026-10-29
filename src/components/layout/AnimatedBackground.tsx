import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const AnimatedBackground: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{
        background: 'linear-gradient(180deg, #F8FCFF 0%, #E3F3FF 100%)',
      }}
    >
      {/* Blob 1 - Sky 300 Kiri Atas */}
      <motion.div
        className="absolute -top-28 -left-28 w-[420px] h-[420px] rounded-full bg-sky-300/45 blur-3xl"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, 40, -30, 0],
                y: [0, -30, 40, 0],
                scale: [1, 1.15, 0.95, 1],
              }
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Blob 2 - Sky 200 Kanan Tengah */}
      <motion.div
        className="absolute top-1/4 -right-32 w-[420px] h-[420px] rounded-full bg-sky-200/50 blur-3xl"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, -45, 25, 0],
                y: [0, 35, -25, 0],
                scale: [1, 0.92, 1.12, 1],
              }
        }
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Blob 3 - Sky 400 Bawah Tengah */}
      <motion.div
        className="absolute -bottom-36 left-1/3 w-[420px] h-[420px] rounded-full bg-sky-400/35 blur-3xl"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, 30, -40, 0],
                y: [0, -40, 20, 0],
                scale: [1, 1.1, 0.95, 1],
              }
        }
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Lapisan pola titik halus untuk tekstur kaca */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(#0F2A43 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
    </div>
  );
};