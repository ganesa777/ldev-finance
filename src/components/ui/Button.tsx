import React, { useState } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setRipples((prev) => [...prev, { id, x, y }]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);

    onClick?.(e);
  };

  const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'grad-sky text-white shadow-glass hover:shadow-float focus-visible:shadow-glow',
    secondary:
      'bg-white/80 backdrop-blur-md border border-sky-200 text-sky-600 hover:bg-sky-50 focus-visible:shadow-glow',
    danger:
      'bg-rose-50 border border-rose-200 text-expense hover:bg-rose-100/80 focus-visible:ring-4 focus-visible:ring-rose-200',
    ghost:
      'bg-transparent text-muted hover:text-ink hover:bg-sky-50/80',
  };

  const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'h-10 px-4 text-xs rounded-xl gap-1.5',
    md: 'h-12 px-5 text-sm rounded-2xl gap-2',
    lg: 'h-[52px] px-6 text-base rounded-2xl gap-2.5',
  };

  return (
    <motion.button
      whileHover={disabled || loading ? undefined : { scale: 1.03 }}
      whileTap={disabled || loading ? undefined : { scale: 0.96 }}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`relative overflow-hidden inline-flex items-center justify-center font-semibold transition-shadow outline-none select-none disabled:opacity-60 disabled:cursor-not-allowed ${
        variantClasses[variant]
      } ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          style={{ left: r.x, top: r.y }}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-white/35 animate-ping"
        />
      ))}

      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};