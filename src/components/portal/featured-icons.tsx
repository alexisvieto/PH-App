/** Íconos a medida para las tarjetas destacadas del inicio del residente. */

/** Constructor: figura con casco (Proveedores para el hogar). */
export function ConstructionWorkerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M6 9.6a6 6 0 0 1 12 0Z" />
      <rect x="3.4" y="9.4" width="17.2" height="2" rx="1" />
      <circle cx="12" cy="14.3" r="2.5" />
      <path d="M5.4 22a6.6 6.6 0 0 1 13.2 0Z" />
    </svg>
  );
}

/** Canasta de mercado (A domicilio). */
export function MarketBasketIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m5 11 4-7" />
      <path d="m19 11-4-7" />
      <path d="M2 11h20" />
      <path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.6-7.4" />
      <path d="M9 15v3" />
      <path d="M15 15v3" />
    </svg>
  );
}
