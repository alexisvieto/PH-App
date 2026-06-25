"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  DoorOpen,
  Loader2,
  LogOut,
  Package,
  ScanLine,
  Search,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { lookupPass, registerVisit, type PassLookup } from "@/app/app/accesos/actions";
import { PASS_TYPE_LABEL } from "@/lib/access";
import { formatDate } from "@/lib/format";
import { useIsNativeApp, scanQrCode } from "@/lib/native";
import { createClient } from "@/lib/supabase/client";

const input =
  "w-full min-h-12 rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
type Found = Extract<PassLookup, { ok: true }>;
type UnitOption = { id: string; label: string };

export function GaritaConsole({
  orgId,
  buildings,
  units,
}: {
  orgId: string;
  buildings: UnitOption[];
  units: UnitOption[];
}) {
  const singleBuilding = buildings.length === 1 ? buildings[0].id : null;
  const router = useRouter();
  const isNative = useIsNativeApp();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [lookupErr, setLookupErr] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [walkOpen, setWalkOpen] = useState(false);

  // null = sin foto; false = error al subir (aborta el flujo); string = ruta ok.
  async function uploadPhoto(): Promise<string | null | false> {
    if (!photo) return null;
    const ext = EXT[photo.type];
    if (!ext) {
      toast.error("Formato de foto no permitido.");
      return false;
    }
    const path = `${orgId}/accesos/${crypto.randomUUID()}.${ext}`;
    const up = await createClient().storage.from("ph-photos").upload(path, photo, { contentType: photo.type });
    if (up.error) {
      toast.error("No se pudo subir la foto.");
      return false;
    }
    return path;
  }

  async function doLookup(value: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setLookupErr(null);
    setFound(null);
    const res = await lookupPass(value);
    busyRef.current = false;
    setBusy(false);
    if (res.ok) setFound(res);
    else setLookupErr(res.error);
  }

  async function onLookup(e: React.FormEvent) {
    e.preventDefault();
    await doLookup(code);
  }

  // En la app nativa: escanea el QR con la cámara y valida de una vez.
  async function onScan() {
    if (busyRef.current) return;
    const scanned = await scanQrCode();
    if (!scanned) return;
    setCode(scanned.toUpperCase());
    await doLookup(scanned);
  }

  /** Si el registro falla tras subir la foto, borra la foto huérfana del bucket. */
  async function cleanupPhoto(path: string | null) {
    if (path) await createClient().storage.from("ph-photos").remove([path]);
  }

  async function register(direction: "entrada" | "salida", passId?: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const photoPath = await uploadPhoto();
    if (photoPath === false) {
      busyRef.current = false;
      setBusy(false);
      return;
    }
    const res = await registerVisit({
      passId: passId ?? null,
      visitorName: found?.pass.visitor_name ?? "",
      direction,
      photoPath,
    });
    busyRef.current = false;
    setBusy(false);
    if (res.ok) {
      toast.success(direction === "entrada" ? "Entrada registrada." : "Salida registrada.");
      setFound(null);
      setCode("");
      setPhoto(null);
      router.refresh();
    } else {
      await cleanupPhoto(photoPath);
      toast.error(res.error ?? "Error");
    }
  }

  async function onWalkIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const photoPath = await uploadPhoto();
    if (photoPath === false) {
      busyRef.current = false;
      setBusy(false);
      return;
    }
    const res = await registerVisit({
      passId: null,
      visitorName: String(f.get("visitor_name") ?? ""),
      visitorDoc: String(f.get("visitor_doc") ?? ""),
      vehiclePlate: String(f.get("vehicle_plate") ?? ""),
      unitId: String(f.get("unit_id") ?? "") || null,
      buildingId: String(f.get("building_id") ?? "") || singleBuilding,
      direction: String(f.get("direction") ?? "entrada"),
      photoPath,
    });
    busyRef.current = false;
    setBusy(false);
    if (res.ok) {
      toast.success("Registro guardado.");
      setWalkOpen(false);
      setPhoto(null);
      router.refresh();
    } else {
      await cleanupPhoto(photoPath);
      toast.error(res.error ?? "Error");
    }
  }

  const PhotoInput = (
    <label className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm font-medium text-brand transition hover:bg-gray-50 sm:w-auto">
      <Camera className="size-4" /> {photo ? "Foto lista ✓" : "Tomar foto"}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
      />
    </label>
  );

  return (
    <div className="space-y-5">
      {/* HÉROE: validar pase (la acción más frecuente del guardia) */}
      <form onSubmit={onLookup} className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <ScanLine className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold leading-tight">Validar pase</h2>
            <p className="text-xs text-muted">Escanea o escribe el código del visitante</p>
          </div>
        </div>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CÓDIGO"
          autoCapitalize="characters"
          autoComplete="off"
          inputMode="text"
          className={`${input} h-14 text-center font-mono text-2xl font-semibold tracking-[0.3em] placeholder:tracking-widest placeholder:text-gray-300`}
          autoFocus
        />
        <div className="mt-2 flex gap-2">
          {isNative && (
            <button
              type="button"
              onClick={onScan}
              disabled={busy}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              <ScanLine className="size-5" /> Escanear QR
            </button>
          )}
          <button
            type="submit"
            disabled={busy}
            className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold transition disabled:opacity-60 ${
              isNative
                ? "border border-line text-ink hover:bg-gray-50"
                : "bg-brand text-white hover:opacity-90"
            }`}
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />} Buscar
          </button>
        </div>

        {lookupErr && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-white">
            <XCircle className="size-5 shrink-0" />
            <p className="font-medium">{lookupErr}</p>
          </div>
        )}

        {found && (
          <div className="mt-4 space-y-3">
            {/* Veredicto: grande y de color, legible de un vistazo */}
            <div
              className={`rounded-2xl px-4 py-4 text-center text-white ${
                found.canEnter ? "bg-emerald-600" : "bg-red-600"
              }`}
            >
              <p className="flex items-center justify-center gap-2 text-2xl font-bold">
                {found.canEnter ? (
                  <CheckCircle2 className="size-7" />
                ) : (
                  <XCircle className="size-7" />
                )}
                {found.canEnter ? "Puede ingresar" : "No puede ingresar"}
              </p>
              {!found.canEnter && <p className="mt-0.5 text-sm text-white">{found.reason}</p>}
            </div>

            <div className="rounded-2xl border border-line p-4">
              <p className="text-lg font-semibold">{found.pass.visitor_name}</p>
              <p className="mt-1 text-sm text-muted">
                {PASS_TYPE_LABEL[found.pass.type]} · Unidad {found.unitCode ?? "—"} · Vence{" "}
                {formatDate(found.pass.valid_to)}
                {found.pass.vehicle_plate ? ` · Placa ${found.pass.vehicle_plate}` : ""}
                {found.pass.max_uses !== null ? ` · Usos ${found.pass.uses_count}/${found.pass.max_uses}` : ""}
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                {PhotoInput}
                <button
                  onClick={() => register("entrada", found.pass.id)}
                  disabled={busy || !found.canEnter}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60 sm:w-auto sm:flex-1"
                >
                  <DoorOpen className="size-5" /> Entrada
                </button>
                <button
                  onClick={() => register("salida", found.pass.id)}
                  disabled={busy}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-base font-semibold text-ink transition hover:bg-gray-50 disabled:opacity-60 sm:w-auto sm:flex-1"
                >
                  <LogOut className="size-5" /> Salida
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Accesos directos: visita sin pase + paquetería */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setWalkOpen((v) => !v)}
          aria-pressed={walkOpen}
          className={`flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border bg-surface p-3 text-center transition hover:border-brand ${
            walkOpen ? "border-brand ring-1 ring-brand" : "border-line"
          }`}
        >
          <span className="flex size-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
            <UserPlus className="size-8" />
          </span>
          <span className="text-sm font-semibold leading-tight">Visita sin pase</span>
        </button>

        {/* Paquetería: look de caja de cartón (kraft + cinta), con la caja dominando. */}
        <Link
          href="/app/paqueteria"
          className="relative flex min-h-24 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl p-3 text-center shadow-sm transition hover:brightness-[0.97]"
          style={{ background: "linear-gradient(135deg, #dcbd92 0%, #c79a63 100%)" }}
        >
          {/* cinta de embalaje */}
          <span className="pointer-events-none absolute inset-x-0 top-1/2 h-7 -translate-y-1/2 bg-[#e7d3b0]/70" />
          <span className="relative flex size-16 items-center justify-center rounded-2xl bg-[#fff7ea] text-[#8a5a25] shadow-sm">
            <Package className="size-10" />
          </span>
          <span className="relative text-sm font-semibold leading-tight text-[#4a3420]">Paquetería</span>
        </Link>
      </div>

      {/* Formulario de visita sin pase (se despliega bajo los accesos) */}
      {walkOpen && (
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Visita sin pase</h2>
            <button
              type="button"
              onClick={() => setWalkOpen(false)}
              className="flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-gray-100 hover:text-ink"
              aria-label="Cerrar"
            >
              <X className="size-5" />
            </button>
          </div>
          <form onSubmit={onWalkIn} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">Visitante</span>
                <input name="visitor_name" required className={input} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">Documento</span>
                <input name="visitor_doc" className={input} placeholder="Opcional" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">Unidad que visita</span>
                <select name="unit_id" defaultValue="" className={input}>
                  <option value="">Sin unidad (común)</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </label>
              {buildings.length > 1 && (
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted">Edificio (si es área común)</span>
                  <select name="building_id" defaultValue="" className={input}>
                    <option value="">Selecciona…</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">Placa</span>
                <input
                  name="vehicle_plate"
                  autoCapitalize="characters"
                  className={`${input} uppercase placeholder:normal-case`}
                  placeholder="Opcional"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">Dirección</span>
                <select name="direction" defaultValue="entrada" className={input}>
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                </select>
              </label>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              {PhotoInput}
              <button
                type="submit"
                disabled={busy}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
              >
                {busy && <Loader2 className="size-5 animate-spin" />} Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
