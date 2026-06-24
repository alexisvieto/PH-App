import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Retorno de Yappy tras el pago. Valida el hash y registra el pago vía el RPC
 * SECURITY DEFINER (el secret nunca sale de Postgres), luego redirige al estado
 * de cuenta. Los nombres de los parámetros se ajustan a la doc oficial de Yappy.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const orderRef = sp.get("orderId") ?? sp.get("order_ref") ?? "";
  const status = sp.get("status") ?? "";
  const confirmation = sp.get("confirmationNumber") ?? sp.get("confirmation") ?? "";
  const hash = sp.get("hash") ?? "";

  const supabase = await createClient();
  let result = "sin_referencia";
  let unitId: string | null = null;

  if (orderRef) {
    const { data } = await supabase.rpc("confirm_yappy_payment", {
      p_order_ref: orderRef,
      p_status: status,
      p_confirmation: confirmation,
      p_hash: hash,
    });
    result = (data as string | null) ?? "error";
    const { data: order } = await supabase
      .from("payment_orders")
      .select("unit_id")
      .eq("order_ref", orderRef)
      .maybeSingle();
    unitId = order?.unit_id ?? null;
  }

  const dest = unitId ? `/portal/unidades/${unitId}?pago=${result}` : `/portal?pago=${result}`;
  return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
}
