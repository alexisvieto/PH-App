import { StyleSheet, Text, View } from "@react-pdf/renderer";

import type { Brand } from "@/lib/brand";
import { PRODUCT_CREDIT } from "@/lib/brand";

/** Estilos base compartidos por los documentos (diseño profesional, marca por tenant). */
export function pdfStyles(brand: Brand) {
  return StyleSheet.create({
    page: {
      paddingTop: 40,
      paddingBottom: 64,
      paddingHorizontal: 48,
      fontSize: 10,
      color: "#1f2937",
      fontFamily: "Helvetica",
      lineHeight: 1.5,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: brand.primary,
      color: "#ffffff",
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 8,
      marginBottom: 24,
    },
    brandName: { fontSize: 15, fontFamily: "Helvetica-Bold" },
    headerRight: { fontSize: 9, color: "#ffffff", opacity: 0.9, textAlign: "right" },
    docType: {
      fontSize: 9,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: brand.primary,
      fontFamily: "Helvetica-Bold",
      marginBottom: 4,
    },
    title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 16 },
    metaGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
    metaCell: { width: "50%", marginBottom: 6, paddingRight: 8 },
    metaLabel: { fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 },
    metaValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },
    section: { marginTop: 16 },
    sectionTitle: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: brand.primary,
      borderBottomWidth: 1,
      borderColor: "#e5e7eb",
      paddingBottom: 4,
      marginBottom: 8,
    },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    rowLabel: { color: "#374151" },
    rowValue: { fontFamily: "Helvetica-Bold" },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderColor: "#1f2937",
    },
    totalLabel: { fontSize: 13, fontFamily: "Helvetica-Bold" },
    totalValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: brand.primary },
    note: { marginTop: 14, fontSize: 9, color: "#6b7280" },
    sign: { marginTop: 56, flexDirection: "row", justifyContent: "space-between" },
    signBox: { width: "45%", borderTopWidth: 1, borderColor: "#9ca3af", paddingTop: 6, textAlign: "center", fontSize: 9 },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 48,
      right: 48,
      borderTopWidth: 1,
      borderColor: "#e5e7eb",
      paddingTop: 8,
      flexDirection: "row",
      justifyContent: "space-between",
      color: "#9ca3af",
      fontSize: 8,
    },
  });
}

export function BrandHeader({
  brand,
  generatedOn,
  styles,
}: {
  brand: Brand;
  generatedOn: string;
  styles: ReturnType<typeof pdfStyles>;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.brandName}>{brand.name}</Text>
      <Text style={styles.headerRight}>Emitido el {generatedOn}</Text>
    </View>
  );
}

export function Footer({
  brand,
  styles,
}: {
  brand: Brand;
  styles: ReturnType<typeof pdfStyles>;
}) {
  return (
    <View style={styles.footer} fixed>
      <Text>{brand.exportCredit ? `${brand.name} · ${PRODUCT_CREDIT}` : brand.name}</Text>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  );
}
