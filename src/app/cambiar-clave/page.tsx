import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { ChangePasswordForm } from "@/components/change-password-form";
import { PRODUCT_NAME } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";

export default async function CambiarClavePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <div className="text-center">
          <ShieldCheck className="mx-auto size-8 text-brand" />
          <h1 className="mt-2 text-xl font-semibold">Crea tu contraseña</h1>
          <p className="mt-1 text-sm text-muted">
            Por seguridad, define una contraseña nueva para tu cuenta de {PRODUCT_NAME} antes de continuar.
          </p>
        </div>
        <ChangePasswordForm />
      </div>
    </main>
  );
}
