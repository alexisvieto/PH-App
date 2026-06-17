"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createAnomaly, recordAnomalyPhotos } from "@/app/app/anomalias/actions";
import { createClient } from "@/lib/supabase/client";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

const MAX_PHOTOS = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB (igual al límite del bucket)
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type Option = { id: string; name: string };

// A diferencia del resto de formularios (useActionState + useFormPanel), este
// orquesta un flujo multi-paso en cliente: crear anomalía → subir fotos a
// Storage con la sesión del usuario (RLS por carpeta) → registrar las rutas.
// Por eso maneja su propio estado y usa router.refresh() al terminar.
export function NewAnomalyForm({
  buildings,
  equipment,
  suppliers,
  defaultEquipmentId = "",
  defaultBuildingId = "",
}: {
  buildings: Option[];
  equipment: Option[];
  suppliers: Option[];
  defaultEquipmentId?: string;
  defaultBuildingId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(Boolean(defaultEquipmentId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Reportar anomalía
      </button>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);

    const form = new FormData(e.currentTarget);
    const res = await createAnomaly({
      buildingId: String(form.get("building_id") ?? ""),
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      equipmentId: String(form.get("equipment_id") ?? "") || null,
      supplierId: String(form.get("supplier_id") ?? "") || null,
    });
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }

    // Subir fotos al bucket privado con la sesión del usuario (RLS por carpeta = org).
    const supabase = createClient();
    const paths: string[] = [];
    for (const file of files) {
      const ext = EXT_BY_TYPE[file.type];
      if (!ext) {
        toast.error(`Formato no permitido: ${file.name}`);
        continue;
      }
      const path = `${res.orgId}/anomalias/${res.anomalyId}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage
        .from("ph-photos")
        .upload(path, file, { contentType: file.type });
      if (up.error) {
        toast.error(`No se pudo subir ${file.name}.`);
        continue;
      }
      paths.push(path);
    }

    if (paths.length > 0) {
      const rec = await recordAnomalyPhotos(res.anomalyId, paths);
      if (!rec.ok && rec.error) toast.error(rec.error);
    }

    // Si se eligieron fotos pero ninguna subió, no fingir éxito completo.
    if (files.length > 0 && paths.length === 0) {
      toast.error("Reporte creado, pero no se pudo subir ninguna foto.");
    } else {
      toast.success("Anomalía reportada.");
    }
    setBusy(false);
    setOpen(false);
    setFiles([]);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Reportar anomalía</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Título</span>
          <input name="title" required autoFocus className={input} placeholder="Ej. Fuga en bomba de presión" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Edificio</span>
          <select name="building_id" required className={input} defaultValue={defaultBuildingId}>
            <option value="" disabled>
              Selecciona…
            </option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Equipo</span>
          <select name="equipment_id" className={input} defaultValue={defaultEquipmentId}>
            <option value="">Sin equipo asociado</option>
            {equipment.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Descripción</span>
          <textarea name="description" required rows={3} className={input} placeholder="Qué ocurre, dónde y desde cuándo." />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Proveedor sugerido</span>
          <select name="supplier_id" className={input} defaultValue="">
            <option value="">Sin proveedor</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Fotos (hasta {MAX_PHOTOS})</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand"
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS);
              const tooBig = picked.filter((f) => f.size > MAX_FILE_SIZE);
              if (tooBig.length > 0)
                toast.error(`${tooBig.length} archivo(s) superan 10 MB y se omitieron.`);
              setFiles(picked.filter((f) => f.size <= MAX_FILE_SIZE));
            }}
          />
          {files.length > 0 && (
            <span className="mt-1 block text-xs text-muted">
              {files.length} foto(s) seleccionada(s)
            </span>
          )}
        </label>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && (
            <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {busy ? "Guardando…" : "Reportar"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={busy}
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
