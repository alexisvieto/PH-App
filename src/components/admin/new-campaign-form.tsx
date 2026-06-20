"use client";

import { useActionState, useState } from "react";
import { ImagePlus, Loader2, Plus } from "lucide-react";

import { createCampaign } from "@/app/admin/publicidad/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { createClient } from "@/lib/supabase/client";

const input =
  "w-full min-h-11 rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand";
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

type OrgOption = { id: string; name: string };

export function NewCampaignForm({ orgs }: { orgs: OrgOption[] }) {
  const [state, action] = useActionState(createCampaign, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Campaña creada (en pausa).");
  const [isGlobal, setIsGlobal] = useState(true);
  const [imagePath, setImagePath] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = EXT[file.type];
    if (!ext) return;
    setUploading(true);
    const supabase = createClient();
    const path = `ads/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from("ph-ads").upload(path, file, { contentType: file.type });
    setUploading(false);
    if (up.error) return;
    setImagePath(path);
    setPreviewUrl(supabase.storage.from("ph-ads").getPublicUrl(path).data.publicUrl);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
      >
        <Plus className="size-4" /> Nueva campaña
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Nueva campaña</h2>

      {/* Imagen */}
      <input type="hidden" name="image_path" value={imagePath} />
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Imagen del anuncio</span>
        <div className="flex items-center gap-3">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-brand transition hover:bg-gray-50">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {imagePath ? "Cambiar imagen" : "Subir imagen"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPickImage} />
          </label>
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Vista previa" className="h-12 rounded-lg border border-line object-contain" />
          )}
        </div>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Anunciante</span>
          <input name="advertiser_name" required className={input} placeholder="Ferretería El Tornillo" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Título</span>
          <input name="title" required className={input} placeholder="20% en herramientas" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Enlace (al tocar el anuncio)</span>
          <input name="link_url" type="url" inputMode="url" className={input} placeholder="https://… (opcional)" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Vigente desde</span>
          <input name="starts_on" type="date" className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Vigente hasta</span>
          <input name="ends_on" type="date" className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Prioridad</span>
          <input name="priority" type="number" min="0" step="1" defaultValue="0" className={input} />
        </label>
      </div>

      {/* Segmentación */}
      <div className="rounded-lg border border-line p-4">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="is_global"
            checked={isGlobal}
            onChange={(e) => setIsGlobal(e.target.checked)}
            className="size-4"
          />
          Toda la red (todas las organizaciones)
        </label>
        {!isGlobal && (
          <div className="mt-3 space-y-2 border-t border-line pt-3">
            <p className="text-xs text-muted">Organizaciones donde se muestra:</p>
            <div className="flex flex-wrap gap-2">
              {orgs.map((o) => (
                <label key={o.id} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm">
                  <input type="checkbox" name="target_org_ids" value={o.id} className="size-4" />
                  {o.name}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton pendingText="Creando…">Crear campaña</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-lg px-4 py-2.5 text-sm font-medium text-muted hover:text-ink">
          Cancelar
        </button>
      </div>
    </form>
  );
}
