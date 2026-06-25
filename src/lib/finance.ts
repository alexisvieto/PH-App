import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

/** Tolerancia de centavos para considerar una unidad "al día" (saldo ≈ 0). */
export const BALANCE_TOLERANCE = 0.005;

export const CHARGE_CONCEPT_LABEL: Record<Enums["charge_concept"], string> = {
  mantenimiento: "Mantenimiento",
  extraordinaria: "Extraordinaria",
  multa: "Multa",
  recargo: "Recargo por morosidad",
  otro: "Otro",
};

export const PAYMENT_METHOD_LABEL: Record<Enums["payment_method"], string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  cheque: "Cheque",
  tarjeta: "Tarjeta",
  yappy: "Yappy",
  otro: "Otro",
};

export const EXPENSE_CATEGORY_LABEL: Record<Enums["expense_category"], string> = {
  servicios: "Servicios",
  mantenimiento: "Mantenimiento",
  personal: "Personal",
  administrativo: "Administrativo",
  seguros: "Seguros",
  reserva: "Fondo de reserva",
  otro: "Otro",
};

export const FEE_METHOD_LABEL: Record<Enums["fee_method"], string> = {
  por_coeficiente: "Por coeficiente (% de participación)",
  monto_fijo: "Monto fijo por unidad",
};

export const CHARGE_CONCEPT_OPTIONS = Object.entries(CHARGE_CONCEPT_LABEL) as [
  Enums["charge_concept"],
  string,
][];
export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABEL) as [
  Enums["payment_method"],
  string,
][];
export const EXPENSE_CATEGORY_OPTIONS = Object.entries(
  EXPENSE_CATEGORY_LABEL,
) as [Enums["expense_category"], string][];
export const FEE_METHOD_OPTIONS = Object.entries(FEE_METHOD_LABEL) as [
  Enums["fee_method"],
  string,
][];

/** Etiqueta de período "YYYY-MM-DD" → "MM/YYYY". */
export function periodLabel(period: string | null): string {
  if (!period) return "—";
  const [y, m] = period.split("-");
  return m && y ? `${m}/${y}` : period;
}
