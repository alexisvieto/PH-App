import "server-only";

import { createClient } from "@/lib/supabase/server";

export type YappyConfig = {
  enabled: boolean;
  merchantId: string | null;
  sandbox: boolean;
  hasSecret: boolean;
};

/** Lee la config de Yappy de una organización (sin el secret, que vive en Vault). */
export async function getYappyConfig(orgId: string): Promise<YappyConfig | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("org_payment_settings")
    .select("enabled, merchant_id, sandbox, secret_name")
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!data) return null;
  return {
    enabled: data.enabled,
    merchantId: data.merchant_id,
    sandbox: data.sandbox,
    hasSecret: !!data.secret_name,
  };
}

/** Referencia de orden para Yappy (única por organización en la práctica). */
export function genOrderRef(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return "PH-" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/**
 * Crea la orden en Yappy y devuelve la URL de pago.
 *
 * PENDIENTE: requiere las credenciales del sandbox de Yappy (Banco General) y
 * leer el secret del comercio del lado servidor. La llamada HTTP real al Botón
 * de Pago se conecta aquí una vez tengamos el sandbox. Hoy devuelve "no listo"
 * de forma controlada para no simular un cobro.
 */
export async function createYappyOrder(vars: {
  orgId: string;
  orderRef: string;
  amount: number;
}): Promise<{ ready: boolean; url?: string; error?: string }> {
  void vars; // se usará al conectar el sandbox de Yappy (HTTP al Botón de Pago)
  return { ready: false, error: "Yappy aún no está conectado al sandbox." };
}
