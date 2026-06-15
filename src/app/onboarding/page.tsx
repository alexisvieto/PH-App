import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/onboarding-form";
import { PRODUCT_NAME } from "@/lib/brand";
import { getSessionContext } from "@/lib/session";

export default async function OnboardingPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (ctx.activeOrg) redirect("/app");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Bienvenido a {PRODUCT_NAME}</h1>
          <p className="text-sm text-muted">
            Crea tu organización para comenzar. Podrás agregar tus edificios
            enseguida.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <OnboardingForm />
        </div>
      </div>
    </main>
  );
}
