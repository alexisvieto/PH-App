"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { saveUnitInfo } from "@/app/app/propietarios/actions";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

export function UnitInfoForm({
  unitId,
  areaM2,
  isRented,
  tenantName,
  tenantPhone,
}: {
  unitId: string;
  areaM2: number | null;
  isRented: boolean;
  tenantName: string | null;
  tenantPhone: string | null;
}) {
  const router = useRouter();
  const [rented, setRented] = useState(isRented);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const area = String(f.get("area_m2") ?? "").trim();
    const res = await saveUnitInfo(unitId, {
      areaM2: area === "" ? null : Number(area),
      isRented: rented,
      tenantName: String(f.get("tenant_name") ?? ""),
      tenantPhone: String(f.get("tenant_phone") ?? ""),
    });
    busyRef.current = false;
    setBusy(false);
    if (res.ok) {
      toast.success("Unidad actualizada.");
      router.refresh();
    } else toast.error(res.error ?? "Error");
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-4 font-semibold">Información de la unidad</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Metraje (m²)</span>
          <input name="area_m2" type="number" min="0" step="0.01" defaultValue={areaM2 ?? ""} className={input} placeholder="Opcional" />
        </label>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" checked={rented} onChange={(e) => setRented(e.target.checked)} className="size-4" />
          <span className="inline-flex items-center gap-1.5 text-sm font-medium">
            <KeyRound className="size-4 text-brand" /> Unidad alquilada (inquilino, dato informativo)
          </span>
        </label>
        {rented && (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Inquilino — nombre</span>
              <input name="tenant_name" defaultValue={tenantName ?? ""} className={input} placeholder="Opcional" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Inquilino — teléfono</span>
              <input name="tenant_phone" defaultValue={tenantPhone ?? ""} className={input} placeholder="Opcional" />
            </label>
            <p className="text-xs text-muted sm:col-span-2">
              El inquilino es referencia. Las cuentas, multas y documentos van al propietario.
            </p>
          </>
        )}
      </div>
      <button type="submit" disabled={busy} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60">
        {busy && <Loader2 className="size-4 animate-spin" />} Guardar
      </button>
    </form>
  );
}
