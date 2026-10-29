import React, { useState, useId } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  error,
  leftIcon,
  value,
  defaultValue,
  onFocus,
  onBlur,
  className = '',
  ...props
}) => {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const hasValue =
    (value !== undefined && String(value).length > 0) ||
    (defaultValue !== undefined && String(defaultValue).length > 0);
  const isFloating = focused || hasValue || type === 'date';

  return (
    <div className="w-full space-y-1.5 text-left">
      <motion.div
        animate={
          error
            ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.4 }}
        className={`relative flex items-center h-[52px] rounded-2xl bg-white/80 backdrop-blur-md border transition-all ${
          error
            ? 'border-expense shadow-[0_0_0_4px_rgba(244,63,94,0.15)]'
            : focused
            ? 'border-sky-400 shadow-glow bg-white'
            : 'border-sky-100 hover:border-sky-200'
        } ${className}`}
      >
        {leftIcon && (
          <span
            className={`pl-4 pr-1 transition-colors ${
              error ? 'text-expense' : focused ? 'text-sky-500' : 'text-muted'
            }`}
          >
            {leftIcon}
          </span>
        )}

        <div className="relative flex-1 h-full">
          <input
            id={id}
            type={resolvedType}
            value={value}
            defaultValue={defaultValue}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            className={`w-full h-full bg-transparent px-4 pt-4 pb-1 text-sm font-medium text-ink outline-none placeholder-transparent ${
              leftIcon ? 'pl-2' : ''
            } ${isPassword ? 'pr-10' : ''}`}
            placeholder={label}
            {...props}
          />
          <label
            htmlFor={id}
            className={`pointer-events-none absolute left-4 transition-all duration-200 ${
              leftIcon ? 'left-2' : 'left-4'
            } ${
              isFloating
                ? 'top-1.5 text-[11px] font-semibold text-sky-600'
                : 'top-1/2 -translate-y-1/2 text-sm text-muted'
            } ${error ? '!text-expense' : ''}`}
          >
            {label}
          </label>
        </div>

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            className="pr-4 pl-2 text-muted hover:text-ink transition-colors focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-medium text-expense pl-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};