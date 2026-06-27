"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { PRODUCT_CREDIT, PRODUCT_NAME } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.replace("/"); // el resolver decide /app o /portal
        router.refresh();
      } else {
        // Solo se puede crear cuenta si el correo ya está registrado en el padrón
        // de algún edificio (lo enforce además un trigger en el servidor).
        const { data: allowed } = await supabase.rpc("email_is_registered", { p_email: email });
        if (!allowed) {
          toast.error(
            "Tu correo no está registrado. Pídele a la administración de tu edificio que te agregue primero.",
          );
          return; // el finally restablece loading
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        if (data.session) {
          router.replace("/");
          router.refresh();
        } else {
          toast.success(
            "Cuenta creada. Revisa tu correo para confirmar el acceso.",
          );
          setMode("signin");
        }
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo iniciar sesión.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/atrio-lockup.png" alt={PRODUCT_NAME} className="mx-auto mb-3 h-12 w-auto" />
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            One app. One community.
          </p>
          <p className="mt-1 text-sm text-muted">Administración de propiedad horizontal</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-2xl border border-line bg-surface p-6 shadow-sm"
        >
          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre completo</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                placeholder="Tu nombre"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading && (
              <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {mode === "signin" ? "Entrar" : "Crear cuenta"}
          </button>

          <p className="pt-1 text-center text-sm text-muted">
            {mode === "signin" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-brand hover:underline"
            >
              {mode === "signin" ? "Crear una" : "Iniciar sesión"}
            </button>
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          {PRODUCT_CREDIT}
        </p>
      </div>
    </main>
  );
}
