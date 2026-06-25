import { renderToBuffer } from "@react-pdf/renderer";

import { PaymentReceiptPDF } from "@/components/pdf/payment-receipt-pdf";
import { getPaymentReceipt } from "@/lib/payment-receipt";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  if (!UUID.test(paymentId)) return new Response("No encontrado", { status: 404 });

  // La RLS (staff por membresía, residente por titularidad) decide el acceso.
  const receipt = await getPaymentReceipt(paymentId);
  if (!receipt) return new Response("No encontrado", { status: 404 });

  const generatedOn = new Date().toLocaleDateString("es-PA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Panama",
  });

  const buffer = await renderToBuffer(PaymentReceiptPDF({ receipt, generatedOn }));
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Recibo ${receipt.receiptNo}.pdf"`,
    },
  });
}
