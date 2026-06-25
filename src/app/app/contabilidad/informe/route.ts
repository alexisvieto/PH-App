import { renderToBuffer } from "@react-pdf/renderer";

import { AccountingReportPDF } from "@/components/pdf/accounting-report-pdf";
import { getAccountingStatements } from "@/lib/accounting";
import { getSessionContext } from "@/lib/session";

export const runtime = "nodejs";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const STAFF_ROLES = new Set(["owner", "administrador", "asistente"]);

export async function GET(req: Request) {
  const ctx = await getSessionContext();
  const org = ctx?.activeOrg;
  if (!org) return new Response("No autorizado", { status: 401 });
  if (!ctx?.role || !STAFF_ROLES.has(ctx.role)) return new Response("Sin permiso", { status: 403 });

  const url = new URL(req.url);
  const m = url.searchParams.get("m") ?? "";
  const panamaNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Panama" }));
  const ym = /^\d{4}-(0[1-9]|1[0-2])$/.test(m)
    ? m
    : `${panamaNow.getFullYear()}-${String(panamaNow.getMonth() + 1).padStart(2, "0")}`;
  const [y, mo] = ym.split("-").map(Number);
  const mm = String(mo).padStart(2, "0");
  const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const from = `${y}-${mm}-01`;
  const to = `${y}-${mm}-${String(lastDay).padStart(2, "0")}`;
  const periodLabel = `${MESES[mo - 1]} ${y}`;

  const statements = await getAccountingStatements(org.id, from, to);

  const generatedOn = panamaNow.toLocaleDateString("es-PA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Panama",
  });

  const { brandFromOrg } = await import("@/lib/brand");
  const brand = brandFromOrg(org);

  const buffer = await renderToBuffer(
    AccountingReportPDF({
      statements,
      brand,
      orgName: org.name ?? brand.name,
      periodLabel,
      generatedOn,
    }),
  );

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Informe financiero - ${periodLabel}.pdf"`,
    },
  });
}
