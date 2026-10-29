import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export function useCountUp(targetValue: number, durationMs = 1200): number {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(
    shouldReduceMotion ? targetValue : 0
  );
  const previousValueRef = useRef<number>(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(targetValue);
      previousValueRef.current = targetValue;
      return;
    }

    const startValue = previousValueRef.current;
    const change = targetValue - startValue;

    if (change === 0) {
      setDisplayValue(targetValue);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    // Fungsi easing easeOutCubic
    const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeOut(progress);

      const current = startValue + change * easedProgress;
      setDisplayValue(Math.round(current));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(Math.round(targetValue));
        previousValueRef.current = targetValue;
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [targetValue, durationMs, shouldReduceMotion]);

  return displayValue;
}

export default useCountUp;