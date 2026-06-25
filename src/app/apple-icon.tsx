import { ImageResponse } from "next/og";

import { DEFAULT_BRAND } from "@/lib/brand";

// Ícono para la pantalla de inicio en iOS (apple-touch-icon). iOS necesita un
// PNG (no usa el SVG del manifest) y aplica su propia máscara redondeada, así
// que el fondo va a sangre. Dibuja el símbolo "Prisma" (cubo) sobre el azul de
// la marca (colores de brand.ts, sin hardcodear).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M 45.64 18.84 Q 50 16.4 54.36 18.84 L 75.24 30.54 Q 79.6 32.99 75.18 35.32 L 54.42 46.27 Q 50 48.6 45.58 46.27 L 24.82 35.32 Q 20.4 32.99 24.76 30.54 Z" fill="#ffffff"/><path d="M 19.8 39.2 Q 19.72 34.2 24.07 36.67 L 44.43 48.22 Q 48.78 50.69 48.86 55.69 L 49.21 78.8 Q 49.29 83.79 45 81.22 L 24.52 68.92 Q 20.24 66.34 20.16 61.34 Z" fill="#dfe8fb"/><path d="M 75.93 36.67 Q 80.28 34.2 80.2 39.2 L 79.84 61.34 Q 79.76 66.34 75.48 68.92 L 55 81.22 Q 50.71 83.79 50.79 78.8 L 51.14 55.69 Q 51.22 50.69 55.57 48.22 Z" fill="#b9caf3"/></svg>`;

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
          width={142}
          height={142}
          alt=""
          src={`data:image/svg+xml,${encodeURIComponent(MARK)}`}
        />
      </div>
    ),
    { ...size },
  );
}
