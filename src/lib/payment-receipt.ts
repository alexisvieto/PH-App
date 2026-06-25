import "server-only";

import type { Brand } from "@/lib/brand";
import { PAYMENT_METHOD_LABEL } from "@/lib/finance";
import { getUnitStatement } from "@/lib/statement";
import { createClient } from "@/lib/supabase/server";

export type PaymentReceipt = {
  receiptNo: string;
  unitCode: string;
  buildingName: string;
  ownerName: string | null;
  amount: number;
  paidOn: string;
  methodLabel: string;
  reference: string | null;
  currentBalance: number;
  brand: Brand;
};

/**
 * Datos de la constancia/recibo de un pago. La RLS limita el acceso (staff por
 * membresía, residente por titularidad de la unidad), así sirve a ambos.
 * Devuelve null si el pago no es accesible.
 */
export async function getPaymentReceipt(paymentId: string): Promise<PaymentReceipt | null> {
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("payments")
    .select("id, amount, paid_on, method, reference, unit_id")
    .eq("id", paymentId)
    .maybeSingle();
  if (!p) return null;

  const stmt = await getUnitStatement(p.unit_id);
  if (!stmt) return null;

  return {
    receiptNo: `REC-${p.id.slice(0, 8).toUpperCase()}`,
    unitCode: stmt.unitCode,
    buildingName: stmt.buildingName,
    ownerName: stmt.ownerName,
    amount: Number(p.amount ?? 0),
    paidOn: p.paid_on,
    methodLabel: PAYMENT_METHOD_LABEL[p.method],
    reference: p.reference,
    currentBalance: stmt.balance,
    brand: stmt.brand,
  };
}
