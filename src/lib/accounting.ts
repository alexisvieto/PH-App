import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AccountType = "activo" | "pasivo" | "patrimonio" | "ingreso" | "gasto";

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  activo: "Activo",
  pasivo: "Pasivo",
  patrimonio: "Patrimonio",
  ingreso: "Ingreso",
  gasto: "Gasto",
};

export const ACCOUNT_TYPE_PLURAL: Record<AccountType, string> = {
  activo: "Activos",
  pasivo: "Pasivos",
  patrimonio: "Patrimonio",
  ingreso: "Ingresos",
  gasto: "Gastos",
};

type SummaryRow = {
  code: string;
  name: string;
  type: AccountType;
  fund: "operativo" | "imprevistos";
  tax_exempt: boolean;
  period_debit: number;
  period_credit: number;
  cum_debit: number;
  cum_credit: number;
};

export type AcctLine = { code: string; name: string; amount: number };

export type AccountingStatements = {
  /** Estado de Resultados del período seleccionado. */
  income: {
    ingresos: AcctLine[];
    gastos: AcctLine[];
    totalIngresos: number;
    totalGastos: number;
    resultado: number;
  };
  /** Balance General al cierre del período (acumulado). */
  balance: {
    activos: AcctLine[];
    pasivos: AcctLine[];
    patrimonio: AcctLine[]; // incluye el resultado acumulado del ejercicio como línea
    totalActivos: number;
    totalPasivos: number;
    totalPatrimonio: number; // patrimonio + resultado acumulado
    cuadra: boolean; // Activos = Pasivos + Patrimonio
  };
};

const r2 = (n: number) => Math.round(n * 100) / 100;
const num = (x: number) => (Number.isFinite(Number(x)) ? Number(x) : 0);
const isDebitNormal = (t: AccountType) => t === "activo" || t === "gasto";

/** Estados financieros derivados del libro (partida doble). Staff. */
export async function getAccountingStatements(
  orgId: string,
  from: string,
  to: string,
): Promise<AccountingStatements> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("accounting_summary", { p_org: orgId, p_from: from, p_to: to });
  const rows = (data ?? []) as unknown as SummaryRow[];

  const ingresos: AcctLine[] = [];
  const gastos: AcctLine[] = [];
  let totalIngresos = 0;
  let totalGastos = 0;

  const activos: AcctLine[] = [];
  const pasivos: AcctLine[] = [];
  const patrimonio: AcctLine[] = [];
  let totalActivos = 0;
  let totalPasivos = 0;
  let totalPatrimonio = 0;
  let ingAcum = 0;
  let gasAcum = 0;

  for (const row of rows) {
    const periodBal = isDebitNormal(row.type)
      ? num(row.period_debit) - num(row.period_credit)
      : num(row.period_credit) - num(row.period_debit);
    const cumBal = isDebitNormal(row.type)
      ? num(row.cum_debit) - num(row.cum_credit)
      : num(row.cum_credit) - num(row.cum_debit);

    const line = (amount: number): AcctLine => ({ code: row.code, name: row.name, amount: r2(amount) });

    // Estado de Resultados (período)
    if (row.type === "ingreso" && Math.abs(periodBal) > 0.005) {
      ingresos.push(line(periodBal));
      totalIngresos += periodBal;
    }
    if (row.type === "gasto" && Math.abs(periodBal) > 0.005) {
      gastos.push(line(periodBal));
      totalGastos += periodBal;
    }

    // Balance General (acumulado)
    if (row.type === "activo" && Math.abs(cumBal) > 0.005) {
      activos.push(line(cumBal));
      totalActivos += cumBal;
    }
    if (row.type === "pasivo" && Math.abs(cumBal) > 0.005) {
      pasivos.push(line(cumBal));
      totalPasivos += cumBal;
    }
    if (row.type === "patrimonio" && Math.abs(cumBal) > 0.005) {
      patrimonio.push(line(cumBal));
      totalPatrimonio += cumBal;
    }
    if (row.type === "ingreso") ingAcum += cumBal;
    if (row.type === "gasto") gasAcum += cumBal;
  }

  // El resultado acumulado del ejercicio cierra el patrimonio (ingresos − gastos no cerrados).
  const resultadoAcum = r2(ingAcum - gasAcum);
  if (Math.abs(resultadoAcum) > 0.005) {
    patrimonio.push({ code: "—", name: "Resultado del ejercicio", amount: resultadoAcum });
    totalPatrimonio += resultadoAcum;
  }

  const cuadra = Math.abs(r2(totalActivos) - r2(totalPasivos + totalPatrimonio)) < 0.01;

  return {
    income: {
      ingresos,
      gastos,
      totalIngresos: r2(totalIngresos),
      totalGastos: r2(totalGastos),
      resultado: r2(totalIngresos - totalGastos),
    },
    balance: {
      activos,
      pasivos,
      patrimonio,
      totalActivos: r2(totalActivos),
      totalPasivos: r2(totalPasivos),
      totalPatrimonio: r2(totalPatrimonio),
      cuadra,
    },
  };
}
