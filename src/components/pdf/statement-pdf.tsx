import { Document, Page, Text, View } from "@react-pdf/renderer";

import { ATRIO, BrandHeader, Footer, pdfStyles } from "@/components/pdf/_kit";
import type { Brand } from "@/lib/brand";
import type { UnitStatement } from "@/lib/statement";

const money = (n: number) =>
  `$${(Number.isFinite(n) ? n : 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function StatementPDF({
  statement: st,
  brand,
  generatedOn,
}: {
  statement: UnitStatement;
  brand: Brand;
  generatedOn: string;
}) {
  const s = pdfStyles(brand);
  const owes = st.balance > 0.005;
  const col = { date: "16%", detail: "40%", num: "14.666%" } as const;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <BrandHeader brand={brand} generatedOn={generatedOn} docType="Estado de cuenta" styles={s} />

        {/* Saldo destacado */}
        <View style={[s.hero, { backgroundColor: brand.primary }]}>
          <Text style={s.heroLabel}>Saldo actual</Text>
          <Text style={s.heroValue}>{money(st.balance)}</Text>
          <Text style={s.heroNote}>{owes ? "Pendiente de pago" : "Estás al día"}</Text>
        </View>

        {/* Datos de la unidad */}
        <View style={s.metaGrid}>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Edificio</Text>
            <Text style={s.metaValue}>{st.buildingName}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Unidad</Text>
            <Text style={s.metaValue}>{st.unitCode}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Propietario</Text>
            <Text style={s.metaValue}>{st.ownerName ?? "—"}</Text>
          </View>
        </View>

        {/* Movimientos */}
        <Text style={s.sectionTitle}>Movimientos</Text>
        <View style={s.tHead}>
          <Text style={[s.th, { width: col.date }]}>Fecha</Text>
          <Text style={[s.th, { width: col.detail }]}>Detalle</Text>
          <Text style={[s.th, { width: col.num, textAlign: "right" }]}>Cargo</Text>
          <Text style={[s.th, { width: col.num, textAlign: "right" }]}>Pago</Text>
          <Text style={[s.th, { width: col.num, textAlign: "right" }]}>Saldo</Text>
        </View>
        {st.movements.length === 0 ? (
          <View style={s.tRow}>
            <Text style={s.tdMuted}>Sin movimientos.</Text>
          </View>
        ) : (
          st.movements.map((m, i) => (
            <View style={s.tRow} key={i} wrap={false}>
              <Text style={[s.tdMuted, { width: col.date }]}>{m.date}</Text>
              <Text style={[s.td, { width: col.detail }]}>{m.concept}</Text>
              <Text style={[s.td, { width: col.num, textAlign: "right" }]}>{m.debit ? money(m.debit) : ""}</Text>
              <Text style={[s.td, { width: col.num, textAlign: "right", color: ATRIO.blue }]}>
                {m.credit ? money(m.credit) : ""}
              </Text>
              <Text style={[s.td, { width: col.num, textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                {money(m.balance)}
              </Text>
            </View>
          ))
        )}

        {/* Totales */}
        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total cargos</Text>
            <Text style={s.totalValue}>{money(st.totalCharges)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total pagos</Text>
            <Text style={s.totalValue}>{money(st.totalPayments)}</Text>
          </View>
          <View style={[s.grandTotal, { backgroundColor: brand.primary }]}>
            <Text style={s.grandLabel}>Saldo</Text>
            <Text style={s.grandValue}>{money(st.balance)}</Text>
          </View>
        </View>

        <Footer brand={brand} styles={s} />
      </Page>
    </Document>
  );
}
