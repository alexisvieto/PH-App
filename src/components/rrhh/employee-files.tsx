"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ImageUp, Loader2, Paperclip } from "lucide-react";
import { toast } from "sonner";

import { setEmployeeFile } from "@/app/app/rrhh/actions";
import { createClient } from "@/lib/supabase/client";

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB (igual al bucket)
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export function EmployeeFiles({
  employeeId,
  orgId,
  photoUrl,
  contractUrl,
}: {
  employeeId: string;
  orgId: string;
  photoUrl: string | null;
  contractUrl: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"photo" | "contract" | null>(null);

  async function upload(kind: "photo" | "contract", file: File) {
    const ext = EXT[file.type];
    if (!ext) {
      toast.error("Formato no permitido (usa JPG, PNG, WEBP o PDF).");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("El archivo supera 20 MB.");
      return;
    }
    setBusy(kind);
    const supabase = createClient();
    const path = `${orgId}/empleados/${employeeId}/${kind}-${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage
      .from("ph-docs")
      .upload(path, file, { contentType: file.type });
    if (up.error) {
      setBusy(null);
      toast.error("No se pudo subir el archivo.");
      return;
    }
    const res = await setEmployeeFile(employeeId, kind, path);
    setBusy(null);
    if (res.ok) {
      toast.success(kind === "photo" ? "Foto actualizada." : "Contrato actualizado.");
      router.refresh();
    } else {
      toast.error(res.error ?? "No se pudo guardar.");
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <Paperclip className="size-5 text-brand" />
        <h2 className="font-semibold">Foto y contrato</h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Foto */}
        <div className="space-y-3">
          <div className="flex size-28 items-center justify-center overflow-hidden rounded-xl border border-line bg-gray-50">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Foto del empleado" className="size-full object-cover" />
            ) : (
              <ImageUp className="size-8 text-muted" />
            )}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium text-brand transition hover:bg-gray-50">
            {busy === "photo" ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
            {photoUrl ? "Cambiar foto" : "Subir foto"}
            <input
              type="file"
              data-testid="upload-photo"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={busy !== null}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload("photo", f);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {/* Contrato */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="size-5 text-muted" />
            {contractUrl ? (
              <a href={contractUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
                Ver contrato
              </a>
            ) : (
              <span className="text-muted">Sin contrato cargado</span>
            )}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium text-brand transition hover:bg-gray-50">
            {busy === "contract" ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
            {contractUrl ? "Reemplazar contrato" : "Subir contrato"}
            <input
              type="file"
              data-testid="upload-contract"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              disabled={busy !== null}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload("contract", f);
                e.target.value = "";
              }}
            />
          </label>
          <p className="text-xs text-muted">PDF o imagen, hasta 20 MB.</p>
        </div>
      </div>
    </div>
  );
}
