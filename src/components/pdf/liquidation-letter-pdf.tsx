import { Document, Page, Text, View } from "@react-pdf/renderer";

import { BrandHeader, Footer, pdfStyles } from "@/components/pdf/_kit";
import type { Brand } from "@/lib/brand";
import { formatMoney } from "@/lib/format";

export type LiquidationLetterData = {
  brand: Brand;
  employeeName: string;
  position: string | null;
  scenarioLabel: string;
  contractLabel: string;
  terminationDate: string;
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
  generatedOn: string;
};

function Line({
  label,
  value,
  s,
  negative,
}: {
  label: string;
  value: number;
  s: ReturnType<typeof pdfStyles>;
  negative?: boolean;
}) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{negative ? `− ${formatMoney(value)}` : formatMoney(value)}</Text>
    </View>
  );
}

export function LiquidationLetterPDF(d: LiquidationLetterData) {
  const s = pdfStyles(d.brand);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <BrandHeader brand={d.brand} generatedOn={d.generatedOn} styles={s} />

        <Text style={s.docType}>Documento de terminación laboral</Text>
        <Text style={s.title}>Liquidación de Prestaciones</Text>

        <View style={s.metaGrid}>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Empleado</Text>
            <Text style={s.metaValue}>{d.employeeName}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Cargo</Text>
            <Text style={s.metaValue}>{d.position ?? "—"}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Motivo de terminación</Text>
            <Text style={s.metaValue}>{d.scenarioLabel}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Tipo de contrato</Text>
            <Text style={s.metaValue}>{d.contractLabel}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Fecha de terminación</Text>
            <Text style={s.metaValue}>{d.terminationDate}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Años de servicio</Text>
            <Text style={s.metaValue}>{d.yearsService}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Salario de referencia</Text>
            <Text style={s.metaValue}>{formatMoney(d.referenceSalary)}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Derechos adquiridos</Text>
          <Line label="Vacaciones proporcionales" value={d.vacaciones} s={s} />
          <Line label="Décimo tercer mes proporcional" value={d.xiiiProporcional} s={s} />
          {d.primaAntiguedad > 0 && <Line label="Prima de antigüedad" value={d.primaAntiguedad} s={s} />}
        </View>

        {(d.preaviso > 0 || d.indemnizacion > 0 || d.incentivoPactado > 0 || d.penalidad > 0) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Conceptos por terminación</Text>
            {d.preaviso > 0 && <Line label="Preaviso" value={d.preaviso} s={s} />}
            {d.indemnizacion > 0 && <Line label="Indemnización (Art. 225 C.T.)" value={d.indemnizacion} s={s} />}
            {d.incentivoPactado > 0 && <Line label="Incentivo pactado" value={d.incentivoPactado} s={s} />}
            {d.penalidad > 0 && <Line label="Penalidad por preaviso no cumplido" value={d.penalidad} s={s} negative />}
          </View>
        )}

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total a pagar</Text>
          <Text style={s.totalValue}>{formatMoney(d.total)}</Text>
        </View>

        <Text style={s.note}>
          Liquidación calculada conforme al Código de Trabajo de la República de Panamá. Los derechos
          adquiridos (vacaciones, décimo tercer mes y prima de antigüedad) se reconocen en toda
          terminación, sin importar la causa.
        </Text>

        <View style={s.sign}>
          <Text style={s.signBox}>Recibí conforme — Trabajador</Text>
          <Text style={s.signBox}>Administración</Text>
        </View>

        <Footer brand={d.brand} styles={s} />
      </Page>
    </Document>
  );
}
