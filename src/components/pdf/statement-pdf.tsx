import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { Brand } from "@/lib/brand";
import { PRODUCT_CREDIT } from "@/lib/brand";
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
  const styles = StyleSheet.create({
    page: { padding: 32, fontSize: 10, color: "#1f2937", fontFamily: "Helvetica" },
    header: {
      backgroundColor: brand.primary,
      color: "#ffffff",
      padding: 16,
      borderRadius: 6,
      marginBottom: 20,
    },
    brandName: { fontSize: 16, fontFamily: "Helvetica-Bold" },
    docTitle: { fontSize: 11, marginTop: 2, opacity: 0.9 },
    infoRow: { flexDirection: "row", marginBottom: 3 },
    infoLabel: { width: 90, color: "#6b7280" },
    infoValue: { fontFamily: "Helvetica-Bold" },
    table: { marginTop: 16, borderTopWidth: 1, borderColor: "#e5e7eb" },
    tr: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderColor: "#e5e7eb",
      paddingVertical: 5,
    },
    th: {
      flexDirection: "row",
      backgroundColor: "#f3f4f6",
      paddingVertical: 6,
      fontFamily: "Helvetica-Bold",
    },
    cDate: { width: "16%", paddingHorizontal: 4 },
    cDetail: { width: "40%", paddingHorizontal: 4 },
    cNum: { width: "14.66%", paddingHorizontal: 4, textAlign: "right" },
    totals: {
      marginTop: 14,
      alignSelf: "flex-end",
      width: 220,
    },
    totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    balanceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      marginTop: 4,
      borderTopWidth: 1,
      borderColor: "#e5e7eb",
      fontFamily: "Helvetica-Bold",
      fontSize: 12,
    },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 32,
      right: 32,
      textAlign: "center",
      color: "#9ca3af",
      fontSize: 8,
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brandName}>{brand.name}</Text>
          <Text style={styles.docTitle}>Estado de cuenta</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Edificio</Text>
          <Text style={styles.infoValue}>{st.buildingName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Unidad</Text>
          <Text style={styles.infoValue}>{st.unitCode}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Propietario</Text>
          <Text style={styles.infoValue}>{st.ownerName ?? "—"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Emitido</Text>
          <Text style={styles.infoValue}>{generatedOn}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={styles.cDate}>Fecha</Text>
            <Text style={styles.cDetail}>Detalle</Text>
            <Text style={styles.cNum}>Cargo</Text>
            <Text style={styles.cNum}>Pago</Text>
            <Text style={styles.cNum}>Saldo</Text>
          </View>
          {st.movements.length === 0 ? (
            <View style={styles.tr}>
              <Text style={{ paddingHorizontal: 4, color: "#9ca3af" }}>
                Sin movimientos.
              </Text>
            </View>
          ) : (
            st.movements.map((m, i) => (
              <View style={styles.tr} key={i} wrap={false}>
                <Text style={styles.cDate}>{m.date}</Text>
                <Text style={styles.cDetail}>{m.concept}</Text>
                <Text style={styles.cNum}>{m.debit ? money(m.debit) : ""}</Text>
                <Text style={styles.cNum}>{m.credit ? money(m.credit) : ""}</Text>
                <Text style={styles.cNum}>{money(m.balance)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Total cargos</Text>
            <Text>{money(st.totalCharges)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Total pagos</Text>
            <Text>{money(st.totalPayments)}</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text>Saldo</Text>
            <Text>{money(st.balance)}</Text>
          </View>
        </View>

        {brand.exportCredit && (
          <Text style={styles.footer} fixed>
            {brand.name} · {PRODUCT_CREDIT}
          </Text>
        )}
      </Page>
    </Document>
  );
}
