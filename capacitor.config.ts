import type { CapacitorConfig } from "@capacitor/cli";

// =========================================================
// Capacitor — modo "shell" (server.url).
//
// Esta app es server-rendered (middleware en proxy.ts, server actions,
// Supabase SSR): NO es exportable a estático. Por eso la app nativa NO
// empaqueta un bundle web, sino que carga el sitio ya desplegado y le
// inyecta plugins nativos (escáner QR, y más adelante push/cámara).
//
// Apunta a otro entorno con CAP_SERVER_URL (p. ej. http://192.168.x.x:3200
// para probar contra tu dev en la LAN). Producción por defecto = Vercel.
//
// appId/appName son el identificador del bundle en las tiendas: difíciles de
// cambiar DESPUÉS de publicar. Confírmalos antes del primer envío.
// =========================================================
const serverUrl = process.env.CAP_SERVER_URL || "https://ph-app-one.vercel.app";

const config: CapacitorConfig = {
  appId: "io.nexerai.modusph",
  appName: "Modus PH",
  webDir: "public", // requerido por el CLI aunque con server.url su contenido se ignora
  server: {
    url: serverUrl,
    cleartext: false, // Vercel es https; solo poner true para dev por http en LAN
  },
};

export default config;
