import type { RuleSet } from "@/lib/payroll/rules";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Lee una constante de fórmula; si no aplica (N/A) usa el fallback. */
function k(rule: RuleSet, key: string, fallback = 0): number {
  const v = rule.constants[key];
  return v === null || v === undefined ? fallback : v;
}

/** ISR anual según los tramos del paquete: baseFixed + rate*(ingreso - lower). */
export function isrAnnual(rule: RuleSet, annualIncome: number): number {
  if (annualIncome <= 0) return 0;
  const b = rule.brackets.find(
    (x) => annualIncome >= x.lower && (x.upper === null || annualIncome < x.upper),
  );
  if (!b) return 0;
  return round2(b.baseFixed + b.rate * (annualIncome - b.lower));
}

// ---------------------------------------------------------------------------
// PLANILLA (cálculo mensual; quincenal = mitad)
// ---------------------------------------------------------------------------

export type PayrollInput = {
  baseSalary: number; // mensual
  workShift: "diurna" | "mixta" | "nocturna";
  frequency: "quincenal" | "mensual";
  declaresDependents: boolean;
  riskPct: number; // riesgos profesionales patronal
  overtime: {
    diurna: number;
    nocturna: number;
    mixta: number;
    fiesta: number;
    fiestaDomingo: number;
  };
  commissions: number;
  otherIncome: number;
  otherDeductions: number;
};

export type PayrollResult = {
  hourlyRate: number;
  overtimeAmount: number;
  gross: number;
  cssEmployee: number;
  seguroEducativoEmployee: number;
  isr: number;
  otherDeductions: number;
  totalDeductions: number;
  net: number;
  cssEmployer: number;
  seguroEducativoEmployer: number;
  riesgosEmployer: number;
  employerCost: number; // bruto + aportes patronales
};

export function computePayroll(rule: RuleSet, input: PayrollInput): PayrollResult {
  const weeklyHours = k(
    rule,
    `jornada_${input.workShift}_horas`,
    input.workShift === "diurna" ? 48 : input.workShift === "mixta" ? 45 : 42,
  );
  const weeksPerMonth = k(rule, "mes_laboral_semanas", 4.3333);
  const hourlyRate = round2(input.baseSalary / (weeksPerMonth * weeklyHours));

  const ot = input.overtime;
  const overtimeAmount = round2(
    hourlyRate *
      (ot.diurna * k(rule, "factor_extra_diurna", 1.25) +
        ot.nocturna * k(rule, "factor_extra_nocturna", 1.49) +
        ot.mixta * k(rule, "factor_extra_mixta", 1.69) +
        ot.fiesta * k(rule, "factor_dia_fiesta", 2.5) +
        ot.fiestaDomingo * k(rule, "factor_extra_fiesta_domingo", 3.75)),
  );

  const gross = round2(
    input.baseSalary + overtimeAmount + input.commissions + input.otherIncome,
  );

  const css = rule.contributions.css;
  const se = rule.contributions.seguro_educativo;
  const cssEmployee = css?.applies ? round2((gross * css.employeePct) / 100) : 0;
  const seEmployee = se?.applies ? round2((gross * se.employeePct) / 100) : 0;

  // ISR: proyección anual del bruto mensual, menos deducción si declara dependientes.
  const projFactor = k(rule, "isr_proyeccion_factor", 13);
  const deduction = input.declaresDependents ? k(rule, "isr_deduccion_dependientes", 0) : 0;
  const annual = gross * projFactor - deduction;
  const isr = round2(isrAnnual(rule, annual) / 12);

  const cssEmployer = css?.applies ? round2((gross * css.employerPct) / 100) : 0;
  const seEmployer = se?.applies ? round2((gross * se.employerPct) / 100) : 0;
  const riesgosEmployer = round2((gross * input.riskPct) / 100);

  const totalDeductions = round2(cssEmployee + seEmployee + isr + input.otherDeductions);
  const net = round2(gross - totalDeductions);

  return {
    hourlyRate,
    overtimeAmount,
    gross,
    cssEmployee,
    seguroEducativoEmployee: seEmployee,
    isr,
    otherDeductions: round2(input.otherDeductions),
    totalDeductions,
    net,
    cssEmployer,
    seguroEducativoEmployer: seEmployer,
    riesgosEmployer,
    employerCost: round2(gross + cssEmployer + seEmployer + riesgosEmployer),
  };
}

// ---------------------------------------------------------------------------
// LIQUIDACIÓN (terminación laboral)
// ---------------------------------------------------------------------------

export type Scenario = "renuncia" | "mutuo_acuerdo" | "despido_injustificado";

export type LiquidationInput = {
  scenario: Scenario;
  baseSalary: number; // mensual
  hireDate: string; // YYYY-MM-DD
  terminationDate: string; // YYYY-MM-DD
  contractType: "indefinido" | "definido";
  cumplioPreaviso: boolean;
  empresaDioPreaviso: boolean;
  incentivoPactado: number;
  referenceSalary?: number; // promedio 6m o último (el más favorable); default base
};

export type LiquidationResult = {
  yearsService: number;
  referenceSalary: number;
  vacaciones: number;
  xiiiProporcional: number;
  primaAntiguedad: number;
  preaviso: number;
  indemnizacion: number;
  incentivoPactado: number;
  penalidad: number;
  total: number;
};

/** Inicio del cuatrimestre del XIII mes que contiene la fecha dada. */
function xiiiPeriodStart(d: Date): Date {
  const y = d.getFullYear();
  const m = d.getMonth() + 1; // 1-12
  const day = d.getDate();
  // 16 dic – 15 abr
  if ((m === 12 && day >= 16) || m <= 3 || (m === 4 && day <= 15)) {
    return new Date(m === 12 ? y : y - 1, 11, 16);
  }
  // 16 abr – 15 ago
  if ((m === 4 && day >= 16) || (m >= 5 && m <= 7) || (m === 8 && day <= 15)) {
    return new Date(y, 3, 16);
  }
  // 16 ago – 15 dic
  return new Date(y, 7, 16);
}

const DAY = 86400000;

export function computeLiquidation(
  rule: RuleSet,
  input: LiquidationInput,
): LiquidationResult {
  const hire = new Date(`${input.hireDate}T00:00:00`);
  const term = new Date(`${input.terminationDate}T00:00:00`);
  const totalDays = Math.max(0, (term.getTime() - hire.getTime()) / DAY);
  const years = totalDays / 365.25;
  const monthsTotal = years * 12;

  const monthly = input.baseSalary;
  const reference = input.referenceSalary && input.referenceSalary > 0 ? input.referenceSalary : monthly;
  const weeksPerMonth = k(rule, "mes_laboral_semanas", 4.3333);
  const weeklyWage = reference / weeksPerMonth;

  // Derechos adquiridos (siempre, en cualquier escenario).
  // Vacaciones: salarios desde el último corte anual / 11.
  const monthsSinceAnniv = monthsTotal % 12;
  const vacacionesSalary = monthly * monthsSinceAnniv;
  const vacaciones = round2(vacacionesSalary / k(rule, "vacaciones_divisor", 11));

  // XIII proporcional: salarios del cuatrimestre vigente / 12.
  const periodStart = xiiiPeriodStart(term);
  const monthsInQuarter = Math.max(0, (term.getTime() - periodStart.getTime()) / DAY / 30.4375);
  const xiii = round2((monthly * monthsInQuarter) / k(rule, "xiii_divisor", 12));

  // Prima de antigüedad (solo indefinido): 1.923% del devengado histórico.
  const historicalGross = monthly * monthsTotal;
  const prima =
    input.contractType === "indefinido"
      ? round2(historicalGross * k(rule, "prima_antiguedad_factor", 0.01923))
      : 0;

  let preaviso = 0;
  let indemnizacion = 0;
  let penalidad = 0;
  let incentivo = 0;

  if (input.scenario === "renuncia") {
    if (!input.cumplioPreaviso)
      penalidad = round2(weeklyWage * k(rule, "penalidad_renuncia_semanas", 1));
  } else if (input.scenario === "mutuo_acuerdo") {
    incentivo = round2(input.incentivoPactado || 0);
  } else {
    // Despido injustificado
    if (!input.empresaDioPreaviso) preaviso = round2(monthly); // 1 mes de sueldo base
    const corte = k(rule, "indemnizacion_corte_anos", 10);
    const semHasta = k(rule, "indemnizacion_sem_por_ano_hasta", 3.4);
    const semDespues = k(rule, "indemnizacion_sem_por_ano_despues", 1);
    const weeks =
      years <= corte ? semHasta * years : semHasta * corte + semDespues * (years - corte);
    indemnizacion = round2(weeks * weeklyWage);
  }

  const total = round2(
    vacaciones + xiii + prima + preaviso + indemnizacion + incentivo - penalidad,
  );

  return {
    yearsService: round2(years),
    referenceSalary: round2(reference),
    vacaciones,
    xiiiProporcional: xiii,
    primaAntiguedad: prima,
    preaviso,
    indemnizacion,
    incentivoPactado: round2(incentivo),
    penalidad,
    total,
  };
}
