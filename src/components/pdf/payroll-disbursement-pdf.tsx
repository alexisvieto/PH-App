import { Document, Page, Text, View } from "@react-pdf/renderer";

import { ATRIO, BrandHeader, Footer, pdfStyles } from "@/components/pdf/_kit";
import type { Brand } from "@/lib/brand";

const money = (n: number) =>
  `$${(Number.isFinite(n) ? n : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Row = { name: string; net: number };

function EmpRow({ name, net }: { name: string; net: number }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderColor: ATRIO.border }}>
      <Text style={{ fontSize: 10, color: ATRIO.text }}>{name}</Text>
      <Text style={{ fontSize: 10, color: ATRIO.text, fontFamily: "Helvetica-Bold" }}>{money(net)}</Text>
    </View>
  );
}

export function PayrollDisbursementPDF({
  brand,
  orgName,
  periodLabel,
  periodRange,
  payDate,
  rows,
  totalNet,
  totalEmployer,
  generatedOn,
}: {
  brand: Brand;
  orgName: string;
  periodLabel: string;
  periodRange: string;
  payDate: string | null;
  rows: Row[];
  totalNet: number;
  totalEmployer: number;
  generatedOn: string;
}) {
  const s = pdfStyles(brand);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <BrandHeader brand={brand} generatedOn={generatedOn} docType="Comprobante de pago" styles={s} />

        <View style={s.subjectRow}>
          <View>
            <Text style={s.subjectName}>{orgName}</Text>
            <Text style={s.subjectMeta}>
              {periodLabel} · {periodRange}
              {payDate ? ` · pagado el ${payDate}` : ""}
            </Text>
          </View>
          <View style={s.saldoBox}>
            <Text style={s.saldoLabel}>Neto pagado</Text>
            <Text style={[s.saldoValue, { color: ATRIO.blue }]}>{money(totalNet)}</Text>
          </View>
        </View>

        <Text style={[s.title, { fontSize: 14, marginBottom: 8 }]}>Pago de planilla</Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: 3, borderBottomWidth: 1.5, borderColor: ATRIO.ink }}>
          <Text style={{ fontSize: 9, color: ATRIO.text3, textTransform: "uppercase" }}>Empleado</Text>
          <Text style={{ fontSize: 9, color: ATRIO.text3, textTransform: "uppercase" }}>Neto</Text>
        </View>
        {rows.map((r, i) => (
          <EmpRow key={i} name={r.name} net={r.net} />
        ))}

        <View style={[s.grandTotal, { marginTop: 12 }]}>
          <Text style={s.grandLabel}>Total neto pagado ({rows.length})</Text>
          <Text style={s.grandValue}>{money(totalNet)}</Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
          <Text style={{ fontSize: 9.5, color: ATRIO.text2 }}>Costo patronal total del período</Text>
          <Text style={{ fontSize: 9.5, color: ATRIO.text2 }}>{money(totalEmployer)}</Text>
        </View>

        <Text style={s.note}>
          Comprobante del desembolso de la planilla. El pago se registró como salida del banco operativo contra la
          cuenta de sueldos por pagar. Cada empleado cuenta además con su recibo individual.
        </Text>

        <Footer brand={brand} styles={s} />
      </Page>
    </Document>
  );
}
