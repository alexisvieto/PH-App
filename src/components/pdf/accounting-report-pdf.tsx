import { Document, Page, Text, View } from "@react-pdf/renderer";

import { ATRIO, BrandHeader, Footer, pdfStyles } from "@/components/pdf/_kit";
import type { AccountingStatements } from "@/lib/accounting";
import type { Brand } from "@/lib/brand";

const money = (n: number) =>
  `$${(Number.isFinite(n) ? n : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Line = { code: string; name: string; amount: number };
type Styles = ReturnType<typeof pdfStyles>;

function ReportBlock({
  title,
  lines,
  total,
  totalLabel,
  s,
}: {
  title: string;
  lines: Line[];
  total: number;
  totalLabel: string;
  s: Styles;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={s.sectionTitle}>{title}</Text>
      {lines.length === 0 ? (
        <Text style={{ fontSize: 9, color: ATRIO.text3, paddingVertical: 2 }}>—</Text>
      ) : (
        lines.map((l, i) => (
          <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}>
            <Text style={{ fontSize: 9.5, color: ATRIO.text }}>
              {l.code !== "—" ? `${l.code}  ` : ""}
              {l.name}
            </Text>
            <Text style={{ fontSize: 9.5, color: ATRIO.text }}>{money(l.amount)}</Text>
          </View>
        ))
      )}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          borderTopWidth: 1,
          borderColor: ATRIO.border,
          marginTop: 2,
          paddingTop: 3,
        }}
      >
        <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: ATRIO.ink }}>{totalLabel}</Text>
        <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: ATRIO.ink }}>{money(total)}</Text>
      </View>
    </View>
  );
}

export function AccountingReportPDF({
  statements,
  brand,
  orgName,
  periodLabel,
  generatedOn,
}: {
  statements: AccountingStatements;
  brand: Brand;
  orgName: string;
  periodLabel: string;
  generatedOn: string;
}) {
  const s = pdfStyles(brand);
  const { income, balance } = statements;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <BrandHeader brand={brand} generatedOn={generatedOn} docType="Informe financiero" styles={s} />

        <View style={s.subjectRow}>
          <View>
            <Text style={s.subjectName}>{orgName}</Text>
            <Text style={s.subjectMeta}>Período: {periodLabel}</Text>
          </View>
          <View style={s.saldoBox}>
            <Text style={s.saldoLabel}>Resultado del mes</Text>
            <Text style={[s.saldoValue, { color: income.resultado >= 0 ? ATRIO.blue : "#B91C1C" }]}>
              {money(income.resultado)}
            </Text>
          </View>
        </View>

        {/* Estado de Resultados */}
        <Text style={[s.title, { fontSize: 14, marginBottom: 8 }]}>Estado de Resultados</Text>
        <ReportBlock title="Ingresos" lines={income.ingresos} total={income.totalIngresos} totalLabel="Total ingresos" s={s} />
        <ReportBlock title="Gastos" lines={income.gastos} total={income.totalGastos} totalLabel="Total gastos" s={s} />
        <View style={[s.grandTotal, { marginTop: 4, marginBottom: 16 }]}>
          <Text style={s.grandLabel}>Excedente / (Déficit) del período</Text>
          <Text style={s.grandValue}>{money(income.resultado)}</Text>
        </View>

        {/* Balance General */}
        <Text style={[s.title, { fontSize: 14, marginBottom: 8 }]}>Balance General</Text>
        <ReportBlock title="Activos" lines={balance.activos} total={balance.totalActivos} totalLabel="Total activos" s={s} />
        <ReportBlock title="Pasivos" lines={balance.pasivos} total={balance.totalPasivos} totalLabel="Total pasivos" s={s} />
        <ReportBlock title="Patrimonio" lines={balance.patrimonio} total={balance.totalPatrimonio} totalLabel="Total patrimonio" s={s} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
          <Text style={{ fontSize: 9.5, color: ATRIO.text2 }}>Pasivos + Patrimonio</Text>
          <Text style={{ fontSize: 9.5, color: ATRIO.text2 }}>{money(balance.totalPasivos + balance.totalPatrimonio)}</Text>
        </View>

        <Text style={s.note}>
          Informe generado del libro de contabilidad (partida doble). El Fondo de Imprevistos y los recargos por
          morosidad se calculan automáticamente según la configuración del PH (Ley 284).
        </Text>

        <Footer brand={brand} styles={s} />
      </Page>
    </Document>
  );
}
