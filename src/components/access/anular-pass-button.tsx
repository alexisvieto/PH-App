"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { anularPass } from "@/app/app/accesos/actions";

export function AnularPassButton({ passId }: { passId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  async function onClick() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const res = await anularPass(passId);
    busyRef.current = false;
    setBusy(false);
    if (res.ok) {
      toast.success("Pase anulado.");
      router.refresh();
    } else toast.error(res.error ?? "Error");
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />} Anular pase
    </button>
  );
}
