import { Document, Page, Text, View } from "@react-pdf/renderer";

import { BrandHeader, Footer, pdfStyles } from "@/components/pdf/_kit";
import type { Brand } from "@/lib/brand";
import { formatMoney } from "@/lib/format";

export type PayslipData = {
  brand: Brand;
  periodLabel: string;
  kindLabel: string;
  periodRange: string;
  payDate: string | null;
  employeeName: string;
  position: string | null;
  nationalId: string | null;
  socialSecurity: string | null;
  isXiii: boolean;
  gross: number;
  cssEmployee: number;
  seguroEducativoEmployee: number;
  isr: number;
  otherDeductions: number;
  net: number;
  cssEmployer: number;
  seguroEducativoEmployer: number;
  riesgosEmployer: number;
  employerCost: number;
  generatedOn: string;
};

function Line({
  label,
  value,
  s,
}: {
  label: string;
  value: string;
  s: ReturnType<typeof pdfStyles>;
}) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

export function PayslipPDF(d: PayslipData) {
  const s = pdfStyles(d.brand);
  const totalDeductions = d.cssEmployee + d.seguroEducativoEmployee + d.isr + d.otherDeductions;
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <BrandHeader brand={d.brand} generatedOn={d.generatedOn} styles={s} />

        <Text style={s.docType}>Comprobante de pago</Text>
        <Text style={s.title}>{d.isXiii ? "Recibo de Décimo Tercer Mes" : "Recibo de Pago"}</Text>

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
            <Text style={s.metaLabel}>Cédula</Text>
            <Text style={s.metaValue}>{d.nationalId ?? "—"}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Seguro Social</Text>
            <Text style={s.metaValue}>{d.socialSecurity ?? "—"}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Planilla</Text>
            <Text style={s.metaValue}>{d.periodLabel}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Período</Text>
            <Text style={s.metaValue}>{d.periodRange}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Ingresos</Text>
          <Line label={d.isXiii ? "Décimo tercer mes (bruto)" : "Salario del período"} value={formatMoney(d.gross)} s={s} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Deducciones</Text>
          <Line
            label={d.isXiii ? "Seguro Social especial (7.25%)" : "Seguro Social (9.75%)"}
            value={`− ${formatMoney(d.cssEmployee)}`}
            s={s}
          />
          {!d.isXiii && <Line label="Seguro educativo (1.25%)" value={`− ${formatMoney(d.seguroEducativoEmployee)}`} s={s} />}
          {(!d.isXiii || d.isr > 0) && <Line label="Impuesto sobre la renta" value={`− ${formatMoney(d.isr)}`} s={s} />}
          {d.otherDeductions > 0 && <Line label="Otras deducciones" value={`− ${formatMoney(d.otherDeductions)}`} s={s} />}
          <Line label="Total deducciones" value={`− ${formatMoney(totalDeductions)}`} s={s} />
        </View>

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Neto a pagar</Text>
          <Text style={s.totalValue}>{formatMoney(d.net)}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Aportes patronales</Text>
          <Line label="Seguro Social patronal" value={formatMoney(d.cssEmployer)} s={s} />
          {!d.isXiii && <Line label="Seguro educativo patronal" value={formatMoney(d.seguroEducativoEmployer)} s={s} />}
          {!d.isXiii && <Line label="Riesgos profesionales" value={formatMoney(d.riesgosEmployer)} s={s} />}
          <Line label="Costo total del empleador" value={formatMoney(d.employerCost)} s={s} />
        </View>

        {d.payDate && <Text style={s.note}>Fecha de pago: {d.payDate}</Text>}
        {d.isXiii && (
          <Text style={s.note}>
            El décimo tercer mes no causa retención de ISR por separado: ya está incluido en la
            proyección mensual ×13 del salario (Decreto Ejecutivo 170/1993). Única deducción: Seguro
            Social especial 7.25% (Decreto Ley 221).
          </Text>
        )}

        <View style={s.sign}>
          <Text style={s.signBox}>Recibí conforme</Text>
          <Text style={s.signBox}>Administración</Text>
        </View>

        <Footer brand={d.brand} styles={s} />
      </Page>
    </Document>
  );
}
