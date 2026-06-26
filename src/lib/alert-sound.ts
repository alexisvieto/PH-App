// Alertas del lado cliente (sonido + vibración) reutilizables por el portal y el
// centro de notificaciones del staff. Silencioso/no-op si el navegador lo bloquea.

let audioCtx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  if (!audioCtx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

/** Chime corto y suave (avisos normales: paquete, notificación). Reusa un AudioContext. */
export function playChime() {
  try {
    const ctx = ensureCtx();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.setValueAtTime(1175, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.start();
    o.stop(ctx.currentTime + 0.42);
  } catch {
    /* el navegador bloqueó el audio sin gesto del usuario: silencioso */
  }
}

/** Alarma estridente y repetida (EMERGENCIAS / SOS): bips alternos tipo sirena. */
export function playAlarm(beeps = 6) {
  try {
    const ctx = ensureCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    for (let i = 0; i < beeps; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "square"; // más penetrante que la sinusoide
      const start = t0 + i * 0.28;
      o.frequency.setValueAtTime(i % 2 === 0 ? 1046 : 784, start); // C6 ↔ G5
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      o.start(start);
      o.stop(start + 0.24);
    }
  } catch {
    /* silencioso si el navegador lo bloquea */
  }
}

/** Vibración (un número de ms o un patrón) donde el dispositivo lo soporte. */
export function shortVibrate(pattern: number | number[] = 200) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(pattern);
  } catch {
    /* no soportado: no-op */
  }
}
