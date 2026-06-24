"use client";

import { useRef, useState } from "react";

/** Botón que solo dispara si se mantiene presionado (anti-falsa-alarma). */
export function HoldButton({
  onFire,
  disabled,
  holdMs = 2000,
  className = "",
  children,
}: {
  onFire: () => void;
  disabled?: boolean;
  holdMs?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const [progress, setProgress] = useState(0); // 0..1
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);

  function clear() {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }

  function start() {
    if (disabled || timer.current) return;
    firedRef.current = false;
    let elapsed = 0;
    const step = 50;
    timer.current = setInterval(() => {
      elapsed += step;
      setProgress(Math.min(1, elapsed / holdMs));
      if (elapsed >= holdMs && !firedRef.current) {
        firedRef.current = true;
        clear();
        setProgress(0);
        onFire();
      }
    }, step);
  }

  function cancel() {
    clear();
    setProgress(0);
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      className={`relative select-none overflow-hidden touch-none disabled:opacity-60 ${className}`}
    >
      {/* relleno de progreso mientras se mantiene presionado */}
      <span
        className="pointer-events-none absolute inset-0 origin-left bg-white/25 transition-none"
        style={{ transform: `scaleX(${progress})` }}
      />
      <span className="relative">{children}</span>
    </button>
  );
}
