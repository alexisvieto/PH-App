import type { RuleSet } from "@/lib/payroll/rules";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Lee una constante de fórmula; si no aplica (N/A) usa el fallback. */
function k(rule: RuleSet, key: string, fallback = 0): number {
  const v = rule.constants[key];
  return v === null || v === undefined ? fallback : v;
}

/** Como k(), pero nunca devuelve 0 (evita división por cero si el paquete está mal configurado). */
function kDiv(rule: RuleSet, key: string, fallback: number): number {
  const v = k(rule, key, fallback);
  return v === 0 ? fallback : v;
}

const DAY = 86400000;

/** Meses (con fracción del mes parcial por días) entre dos fechas de calendario. */
function monthsBetween(from: Date, to: Date): number {
  if (to <= from) return 0;
  let m = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  let d = to.getDate() - from.getDate();
  if (d < 0) {
    m -= 1;
    d += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
  }
  return Math.max(0, m + d / 30.4375);
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
  const weeksPerMonth = kDiv(rule, "mes_laboral_semanas", 4.3333);
  const hourlyRate = round2(input.baseSalary / (weeksPerMonth * (weeklyHours || 1)));

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
  // El divisor mensual es dato del paquete (PA = 12 retenciones al año).
  const projFactor = k(rule, "isr_proyeccion_factor", 13);
  const deduction = input.declaresDependents ? k(rule, "isr_deduccion_dependientes", 0) : 0;
  const annual = gross * projFactor - deduction;
  const isr = round2(isrAnnual(rule, annual) / kDiv(rule, "isr_periodos_mensual", 12));

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

/** Meses (con fracción) entre dos fechas ISO YYYY-MM-DD; expuesto para el lote. */
export function monthsBetweenIso(fromIso: string, toIso: string): number {
  return monthsBetween(new Date(`${fromIso}T00:00:00`), new Date(`${toIso}T00:00:00`));
}

// ---------------------------------------------------------------------------
// PLANILLA POR PERÍODO (lote, salario base) y DÉCIMO TERCER MES (XIII)
// ---------------------------------------------------------------------------

export type PeriodPayrollResult = {
  gross: number;
  cssEmployee: number;
  seguroEducativoEmployee: number;
  isr: number;
  net: number;
  cssEmployer: number;
  seguroEducativoEmployer: number;
  riesgosEmployer: number;
  employerCost: number;
};

/** Planilla del período (salario base prorrateado por frecuencia, sin incidencias en v1). */
export function computePeriodPayroll(
  rule: RuleSet,
  input: {
    baseSalary: number;
    frequency: "quincenal" | "mensual";
    declaresDependents: boolean;
    riskPct: number;
  },
): PeriodPayrollResult {
  const periods = input.frequency === "quincenal" ? 2 : 1;
  const gross = round2(input.baseSalary / periods);
  const css = rule.contributions.css;
  const se = rule.contributions.seguro_educativo;
  const cssE = css?.applies ? round2((gross * css.employeePct) / 100) : 0;
  const seE = se?.applies ? round2((gross * se.employeePct) / 100) : 0;
  const projFactor = k(rule, "isr_proyeccion_factor", 13);
  const deduction = input.declaresDependents ? k(rule, "isr_deduccion_dependientes", 0) : 0;
  const annual = input.baseSalary * projFactor - deduction;
  const isr = round2(isrAnnual(rule, annual) / (kDiv(rule, "isr_periodos_mensual", 12) * periods));
  const cssEr = css?.applies ? round2((gross * css.employerPct) / 100) : 0;
  const seEr = se?.applies ? round2((gross * se.employerPct) / 100) : 0;
  const riesgos = round2((gross * input.riskPct) / 100);
  return {
    gross,
    cssEmployee: cssE,
    seguroEducativoEmployee: seE,
    isr,
    net: round2(gross - cssE - seE - isr),
    cssEmployer: cssEr,
    seguroEducativoEmployer: seEr,
    riesgosEmployer: riesgos,
    employerCost: round2(gross + cssEr + seEr + riesgos),
  };
}

export type XiiiResult = {
  gross: number;
  cssEmployee: number; // CSS especial 7.25% (Decreto Ley 221)
  isr: number;
  net: number;
  cssEmployer: number;
};

/** XIII mes: (salarios del cuatrimestre / 12). Única deducción: CSS especial 7.25%
 *  (Decreto Ley 221). NO se retiene ISR aparte sobre el XIII: ya va incluido en la
 *  proyección mensual ×13 del salario regular (Decreto Ejecutivo 170/1993, anualización DGI). */
export function computeXiii(
  rule: RuleSet,
  input: { baseSalary: number; monthsInQuarter: number },
): XiiiResult {
  const gross = round2((input.baseSalary * input.monthsInQuarter) / kDiv(rule, "xiii_divisor", 12));
  const cx = rule.contributions.css_xiii;
  const cssE = cx?.applies ? round2((gross * cx.employeePct) / 100) : 0;
  const cssEr = cx?.applies ? round2((gross * cx.employerPct) / 100) : 0;
  return { gross, cssEmployee: cssE, isr: 0, net: round2(gross - cssE), cssEmployer: cssEr };
}

/** Ventana de una partida del XIII (1: 16dic–15abr, 2: 16abr–15ago, 3: 16ago–15dic). */
export function xiiiPartidaWindow(partida: 1 | 2 | 3, year: number): { start: string; end: string } {
  if (partida === 1) return { start: `${year - 1}-12-16`, end: `${year}-04-15` };
  if (partida === 2) return { start: `${year}-04-16`, end: `${year}-08-15` };
  return { start: `${year}-08-16`, end: `${year}-12-15` };
}

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

export function computeLiquidation(
  rule: RuleSet,
  input: LiquidationInput,
): LiquidationResult {
  const hire = new Date(`${input.hireDate}T00:00:00`);
  const term = new Date(`${input.terminationDate}T00:00:00`);
  const totalDays = Math.max(0, (term.getTime() - hire.getTime()) / DAY);
  const years = totalDays / 365.25;
  const monthsTotal = monthsBetween(hire, term);

  const monthly = input.baseSalary;
  const reference = input.referenceSalary && input.referenceSalary > 0 ? input.referenceSalary : monthly;
  const weeksPerMonth = kDiv(rule, "mes_laboral_semanas", 4.3333);
  const weeklyWage = reference / weeksPerMonth;

  // Derechos adquiridos (siempre, en cualquier escenario).
  // Vacaciones: salarios desde el último corte (aniversario de contratación) / 11.
  // Se usan meses de calendario (no aritmética flotante) para evitar errores en el borde del aniversario.
  let lastAnniv = new Date(term.getFullYear(), hire.getMonth(), hire.getDate());
  if (lastAnniv > term) lastAnniv = new Date(term.getFullYear() - 1, hire.getMonth(), hire.getDate());
  const monthsSinceAnniv = monthsBetween(lastAnniv, term);
  const vacacionesSalary = monthly * monthsSinceAnniv;
  const vacaciones = round2(vacacionesSalary / kDiv(rule, "vacaciones_divisor", 11));

  // XIII proporcional: salarios del cuatrimestre vigente / 12.
  const periodStart = xiiiPeriodStart(term);
  const monthsInQuarter = monthsBetween(periodStart, term);
  const xiii = round2((monthly * monthsInQuarter) / kDiv(rule, "xiii_divisor", 12));

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
