# Atrio — App móvil (Capacitor)

> Cómo empaquetar el producto como app para **App Store** y **Google Play**.
> Estado: **base lista** (config + manifest + iconos + escáner QR nativo en garita).
> Falta (acción del dueño): cuentas de tienda + generar plataformas en una máquina con SDKs.

---

## Arquitectura: modo "shell" (server.url)

Atrio es **server-rendered** (middleware en `src/proxy.ts`, server actions, Supabase SSR). **No** es exportable a estático, así que la app nativa **no empaqueta un bundle web**: es un contenedor que carga el sitio ya desplegado (Vercel) y le suma **plugins nativos** (escáner QR; luego push/cámara).

Ventajas: un solo código, y los cambios de contenido salen al publicar en Vercel **sin pasar por revisión de tienda**. El identificador del bundle y los plugins nativos son lo único que vive en las tiendas.

> **Apple — regla 4.2 (minimum functionality):** una app que es "solo un sitio web" puede ser rechazada. Por eso usamos funciones nativas reales (escáner QR de la garita y, próximamente, notificaciones push). Mantener/ampliar esas capacidades nativas es lo que sustenta la aprobación.

La config está en [`capacitor.config.ts`](./capacitor.config.ts):
- `appId: "io.nexerai.modusph"` y `appName: "Atrio"` — **confírmalos antes del primer envío** (cambiarlos después de publicar es costoso).
- `server.url` por defecto apunta a producción (Vercel). Override con la variable `CAP_SERVER_URL` (p. ej. tu dev en la LAN).

---

## Requisitos (acción del dueño)

| Plataforma | Cuenta | Costo | Build necesita |
|-----------|--------|-------|----------------|
| Android | Google Play Console | US$25 (único) | Android Studio (Windows/Mac/Linux) |
| iOS | Apple Developer Program | US$99/año | **macOS + Xcode** (iOS no compila en Windows) |

---

## Pasos para generar las apps (en la máquina de build)

```bash
# 1) Instalar las plataformas (genera las carpetas android/ y/o ios/)
npm i -D @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios          # solo en macOS

# 2) Generar iconos y splash a partir de un PNG 1024x1024 de marca
#    (los SVG de public/icons/ sirven para web/PWA; las tiendas piden PNG)
npm i -D @capacitor/assets
#    coloca assets/icon-only.png, assets/icon-foreground.png,
#    assets/icon-background.png y assets/splash.png (1024x1024 / 2732x2732)
npx capacitor-assets generate

# 3) Sincronizar la config (server.url, plugins) con las plataformas
npx cap sync

# 4) Abrir el proyecto nativo y compilar/firmar
npx cap open android     # Android Studio → Build > Generate Signed Bundle (.aab)
npx cap open ios         # Xcode → Archive > Distribute (App Store)
```

Para probar contra tu dev local en un teléfono de la LAN:
```bash
CAP_SERVER_URL=http://192.168.1.50:3200 npx cap sync   # ajusta IP
# y en capacitor.config.ts pon server.cleartext = true mientras sea http
```

---

## Lo que ya quedó en el repo (base)

- **`capacitor.config.ts`** — modo shell con `server.url` por env + config de SplashScreen (no auto-hide; lo ocultamos cuando carga el contenido).
- **`src/app/manifest.ts`** + **`public/icons/`** (`icon.svg`, `maskable.svg`) + **`src/app/icon.svg`** — manifest PWA instalable e iconos de marca. `layout.tsx` declara `themeColor`, `viewport-fit=cover` y `appleWebApp` (standalone en iOS).
- **`src/lib/native.ts`** — `isNativeApp()`, hook `useIsNativeApp()` (seguro en SSR) y `scanQrCode()` (escáner QR nativo, import dinámico). En la web degrada con gracia.
- **`src/components/native-bootstrap.tsx`** — init nativo (corre solo en la app): barra de estado con la marca, **botón atrás de Android** (navega o cierra en la raíz), teclado (resize del body) y **ocultar el splash** cuando el contenido ya cargó. Plugins: `@capacitor/splash-screen`, `status-bar`, `app`, `keyboard` (instalados).
- **Safe areas** — utilidades `.safe-top`/`.safe-bottom` (`env(safe-area-inset-*)`) aplicadas en los headers, el sidebar y las barras inferiores. `overscroll-behavior: none` para quitar el rebote del WebView.
- **Navegación inferior móvil** — bottom-nav en el portal (Inicio / Visitas / Quejas) y para el rol **guardia** (Inicio / Garita). Toaster en `bottom-center`. Botones/inputs a ≥44px táctiles.
- **Garita** — botón **Escanear** QR visible solo en la app nativa; en web sigue la entrada manual del código.

## Pendiente (siguiente iteración)

- Generar plataformas + assets PNG y primer build firmado (requiere cuentas + SDKs).
- **Push notifications** (`@capacitor/push-notifications` + FCM/APNs) — avisos de pases, comunicados, quejas. Es la justificación nativa más fuerte ante la regla 4.2 de Apple.
- **Fallback offline**: un `index.html` local en `webDir` para cuando no hay red (hoy el WebView muestra el error del sistema). Requiere las plataformas generadas.
- **Deep links** (`appUrlOpen`) para que un pase compartido por WhatsApp abra la app.
- Opcional: bloquear orientación a portrait, haptics en acciones clave, service worker para instalación PWA en navegador (Capacitor no lo necesita).
