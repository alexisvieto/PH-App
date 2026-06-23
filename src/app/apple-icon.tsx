import { ImageResponse } from "next/og";

import { DEFAULT_BRAND } from "@/lib/brand";

// Ícono para la pantalla de inicio en iOS (apple-touch-icon). iOS necesita un
// PNG (no usa el SVG del manifest) y aplica su propia máscara redondeada, así
// que el fondo va a sangre, sin esquinas redondeadas internas. Reproduce el
// edificio del ícono de la marca con los colores de brand.ts (sin hardcodear).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const ROWS = [0, 1, 2];

export default function AppleIcon() {
  const { primary, accent } = DEFAULT_BRAND;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Edificio */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#ffffff",
            borderRadius: 12,
            width: 84,
            height: 112,
            paddingTop: 18,
            paddingBottom: 10,
          }}
        >
          {/* Ventanas 3×3 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {ROWS.map((r) => (
              <div key={r} style={{ display: "flex", gap: 9 }}>
                {ROWS.map((c) => (
                  <div
                    key={c}
                    style={{ width: 14, height: 14, borderRadius: 3, background: primary }}
                  />
                ))}
              </div>
            ))}
          </div>
          {/* Puerta */}
          <div style={{ width: 20, height: 30, borderRadius: 4, background: accent }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
