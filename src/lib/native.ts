"use client";

// =========================================================
// Puente nativo (Capacitor). En la web todo esto degrada con gracia:
// isNativeApp() = false y los plugins nativos no se cargan.
// =========================================================
import { useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";

/** ¿Corremos dentro de la app nativa (Capacitor) y no en un navegador? */
export function isNativeApp(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

const subscribeNoop = () => () => {};

/**
 * Hook seguro para SSR: en el servidor devuelve false (sin desajuste de
 * hidratación) y en el cliente el valor real. Evita setState en efectos.
 */
export function useIsNativeApp(): boolean {
  return useSyncExternalStore(subscribeNoop, isNativeApp, () => false);
}

/**
 * Abre el escáner de QR nativo y devuelve el código leído, o null si el
 * usuario cancela o falla. El plugin se importa dinámicamente para no
 * incluirlo en el bundle web ni evaluarlo en SSR.
 */
export async function scanQrCode(): Promise<string | null> {
  if (!isNativeApp()) return null;
  const { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } = await import(
    "@capacitor/barcode-scanner"
  );
  try {
    const res = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
      scanInstructions: "Apunta al código QR del pase",
    });
    return res.ScanResult?.trim() || null;
  } catch {
    return null; // cancelado o sin permiso de cámara
  }
}
