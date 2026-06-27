"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export function AdminSignOut() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace("/login");
        router.refresh();
      }}
      className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
    >
      <LogOut className="size-4" /> Cerrar sesión
    </button>
  );
}
