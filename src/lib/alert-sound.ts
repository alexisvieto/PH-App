// Alertas del lado cliente (sonido + vibración) reutilizables por el portal y el
// centro de notificaciones del staff. Silencioso/no-op si el navegador lo bloquea.

let audioCtx: AudioContext | null = null;

/** Chime corto generado con Web Audio (sin assets). Reusa un único AudioContext. */
export function playChime() {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
    }
    const ctx = audioCtx;
    if (ctx.state === "suspended") void ctx.resume();
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

/** Vibración corta donde el dispositivo lo soporte (móvil). */
export function shortVibrate(ms = 200) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(ms);
  } catch {
    /* no soportado: no-op */
  }
}
