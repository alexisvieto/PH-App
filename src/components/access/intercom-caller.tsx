"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, DoorOpen, Loader2, PhoneCall, X, XCircle } from "lucide-react";
import { toast } from "sonner";

import { registerVisit } from "@/app/app/accesos/actions";
import { cancelIntercom, createIntercom } from "@/app/app/accesos/intercom-actions";
import { createClient } from "@/lib/supabase/client";

type Status = "pendiente" | "autorizada" | "rechazada" | "cancelada";
type Call = {
  id: string;
  unitId: string;
  unitLabel: string;
  visitorName: string;
  contactName: string | null;
  status: Status;
};

const input =
  "w-full min-h-12 rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";

export function IntercomCaller({ units }: { units: { id: string; label: string }[] }) {
  const router = useRouter();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [unitId, setUnitId] = useState("");
  const [visitor, setVisitor] = useState("");
  const [call, setCall] = useState<Call | null>(null);

  // Tiempo real: escucha la respuesta del residente sobre esta solicitud.
  // Dependemos del id + "pendiente" (no del objeto) para no re-suscribir en
  // cada cambio de estado y perder el evento durante la reconexión.
  const callId = call?.id ?? null;
  const pending = call?.status === "pendiente";
  useEffect(() => {
    if (!callId || !pending) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`ic-${callId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "intercom_requests", filter: `id=eq.${callId}` },
        (payload) => {
          const s = (payload.new as { status: Status }).status;
          setCall((c) => (c ? { ...c, status: s } : c));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [callId, pending]);

  async function startCall() {
    if (busyRef.current) return;
    if (!unitId) return toast.error("Selecciona la unidad.");
    if (!visitor.trim()) return toast.error("Escribe el nombre del visitante.");
    busyRef.current = true;
    setBusy(true);
    const res = await createIntercom(unitId, visitor.trim());
    busyRef.current = false;
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    const unitLabel = units.find((u) => u.id === unitId)?.label ?? "";
    setCall({
      id: res.requestId,
      unitId,
      unitLabel,
      visitorName: visitor.trim(),
      contactName: res.contactName,
      status: "pendiente",
    });
  }

  async function onCancel() {
    if (!call) return;
    await cancelIntercom(call.id);
    setCall(null);
    setVisitor("");
  }

  async function registerEntry() {
    if (!call || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const res = await registerVisit({
      passId: null,
      visitorName: call.visitorName,
      unitId: call.unitId,
      direction: "entrada",
    });
    busyRef.current = false;
    setBusy(false);
    if (res.ok) {
      toast.success("Entrada registrada.");
      setCall(null);
      setVisitor("");
      setUnitId("");
      router.refresh();
    } else {
      toast.error(res.error ?? "Error");
    }
  }

  return (
    <div className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          <PhoneCall className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold leading-tight">Citófono</h2>
          <p className="text-xs text-muted">Llama a la unidad para autorizar el ingreso</p>
        </div>
      </div>

      {!call ? (
        <div className="space-y-3">
          <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className={input}>
            <option value="">Selecciona la unidad…</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
          <input
            value={visitor}
            onChange={(e) => setVisitor(e.target.value)}
            placeholder="Nombre del visitante"
            className={input}
          />
          <button
            onClick={startCall}
            disabled={busy}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <PhoneCall className="size-5" />} Llamar a la unidad
          </button>
        </div>
      ) : call.status === "pendiente" ? (
        <div className="space-y-3">
          <div className="rounded-2xl bg-amber-50 p-4 text-center">
            <Loader2 className="mx-auto size-6 animate-spin text-amber-600" />
            <p className="mt-2 font-semibold">Esperando respuesta…</p>
            <p className="text-sm text-muted">
              {call.unitLabel} · {call.contactName ?? "residente"}
            </p>
            <p className="mt-1 text-xs text-muted">Le llegó un aviso en su app.</p>
          </div>
          <button
            onClick={onCancel}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-medium text-muted transition hover:bg-gray-50"
          >
            <X className="size-4" /> Cancelar llamada
          </button>
        </div>
      ) : call.status === "autorizada" ? (
        <div className="space-y-3">
          <div className="rounded-2xl bg-emerald-600 p-4 text-center text-white">
            <CheckCircle2 className="mx-auto size-7" />
            <p className="mt-1 text-xl font-bold">Autorizado</p>
            <p className="text-sm text-white/90">{call.unitLabel} autorizó el ingreso de {call.visitorName}</p>
          </div>
          <button
            onClick={registerEntry}
            disabled={busy}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <DoorOpen className="size-5" />} Registrar entrada
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl bg-red-600 p-4 text-center text-white">
            <XCircle className="mx-auto size-7" />
            <p className="mt-1 text-xl font-bold">{call.status === "rechazada" ? "Rechazado" : "Cancelado"}</p>
            <p className="text-sm text-white/90">No se autorizó el ingreso.</p>
          </div>
          <button
            onClick={() => {
              setCall(null);
              setVisitor("");
            }}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-line px-4 py-3 text-sm font-medium transition hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
