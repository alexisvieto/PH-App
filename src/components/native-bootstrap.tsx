"use client";

import { useEffect } from "react";

import { DEFAULT_BRAND } from "@/lib/brand";
import { isNativeApp } from "@/lib/native";

// Inicialización de la app nativa (Capacitor). En web no hace nada (isNativeApp
// = false). Los plugins se importan dinámicamente para no entrar al bundle web.
export function NativeBootstrap() {
  useEffect(() => {
    if (!isNativeApp()) return;
    let removeBack: (() => void) | undefined;

    (async () => {
      const [{ SplashScreen }, { StatusBar, Style }, { App }, { Keyboard, KeyboardResize }] =
        await Promise.all([
          import("@capacitor/splash-screen"),
          import("@capacitor/status-bar"),
          import("@capacitor/app"),
          import("@capacitor/keyboard"),
        ]);

      // Barra de estado con la marca (texto claro sobre el teal del producto).
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: DEFAULT_BRAND.primary }); // solo Android
      } catch {
        /* iOS no soporta setBackgroundColor: se ignora */
      }

      // El teclado redimensiona el body (evita que tape los inputs).
      try {
        await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
      } catch {
        /* plugin no disponible en esta plataforma */
      }

      // Botón atrás de Android: navega hacia atrás o cierra la app en la raíz.
      const sub = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else App.exitApp();
      });
      removeBack = () => sub.remove();

      // Quita el splash una vez que el contenido ya está montado.
      try {
        await SplashScreen.hide();
      } catch {
        /* sin splash configurado */
      }
    })();

    return () => removeBack?.();
  }, []);

  return null;
}
