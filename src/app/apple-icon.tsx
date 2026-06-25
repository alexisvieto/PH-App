import { ImageResponse } from "next/og";

import { DEFAULT_BRAND } from "@/lib/brand";

// Ícono para la pantalla de inicio en iOS (apple-touch-icon). iOS necesita un
// PNG (no usa el SVG del manifest) y aplica su propia máscara redondeada, así
// que el fondo va a sangre. Dibuja el símbolo de Atrio (rombos apilados) en
// blanco sobre el verde de la marca (colores de brand.ts, sin hardcodear).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="90 60 320 260"><path d="M 250,160 L 390,230 L 250,300 L 110,230 Z" fill="none" stroke="#ffffff" stroke-width="24" stroke-linejoin="round" opacity="0.85"/><path d="M 250,120 L 390,190 L 250,260 L 110,190 Z" fill="none" stroke="#ffffff" stroke-width="24" stroke-linejoin="round" opacity="0.55"/><path d="M 250,80 L 390,150 L 250,220 L 110,150 Z" fill="none" stroke="#ffffff" stroke-width="24" stroke-linejoin="round"/></svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: DEFAULT_BRAND.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width={124}
          height={101}
          alt=""
          src={`data:image/svg+xml,${encodeURIComponent(MARK)}`}
        />
      </div>
    ),
    { ...size },
  );
}
