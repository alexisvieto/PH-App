import { Document, Page, Text, View } from "@react-pdf/renderer";

import { ATRIO, BrandHeader, Footer, pdfStyles } from "@/components/pdf/_kit";
import type { PaymentReceipt } from "@/lib/payment-receipt";

const money = (n: number) =>
  `$${(Number.isFinite(n) ? n : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function fechaLarga(iso: string) {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("es-PA", { day: "numeric", month: "long", year: "numeric" });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderColor: ATRIO.border }}>
      <Text style={{ fontSize: 10, color: ATRIO.text3 }}>{label}</Text>
      <Text style={{ fontSize: 10, color: ATRIO.text, fontFamily: "Helvetica-Bold" }}>{value}</Text>
    </View>
  );
}

export function PaymentReceiptPDF({
  receipt,
  generatedOn,
}: {
  receipt: PaymentReceipt;
  generatedOn: string;
}) {
  const s = pdfStyles(receipt.brand);
  const r = receipt;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <BrandHeader brand={r.brand} generatedOn={generatedOn} docType="Recibo de pago" styles={s} />

        <View style={s.subjectRow}>
          <View>
            <Text style={s.subjectName}>{r.buildingName}</Text>
            <Text style={s.subjectMeta}>Recibo Nº {r.receiptNo}</Text>
          </View>
          <View style={s.saldoBox}>
            <Text style={s.saldoLabel}>Monto recibido</Text>
            <Text style={[s.saldoValue, { color: ATRIO.blue }]}>{money(r.amount)}</Text>
          </View>
        </View>

        <Text style={[s.title, { fontSize: 14, marginBottom: 10 }]}>Constancia de pago</Text>

        <View style={{ marginBottom: 14 }}>
          <Row label="Recibido de" value={r.ownerName ?? "—"} />
          <Row label="Unidad" value={r.unitCode} />
          <Row label="Fecha de pago" value={fechaLarga(r.paidOn)} />
          <Row label="Método" value={r.methodLabel} />
          {r.reference ? <Row label="Referencia" value={r.reference} /> : null}
          <Row label="Monto" value={money(r.amount)} />
        </View>

        <View style={[s.grandTotal, { marginBottom: 16 }]}>
          <Text style={s.grandLabel}>Saldo actual de la unidad</Text>
          <Text style={s.grandValue}>{money(r.currentBalance)}</Text>
        </View>

        <Text style={s.note}>
          Esta constancia certifica que la administración recibió el pago detallado. El saldo mostrado es el de la
          unidad al momento de emitir este recibo y puede variar con nuevos cargos o pagos.
        </Text>

        <Footer brand={r.brand} styles={s} />
      </Page>
    </Document>
  );
}
