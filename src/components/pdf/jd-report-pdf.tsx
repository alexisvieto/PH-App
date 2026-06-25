import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { Brand } from "@/lib/brand";
import { PRODUCT_CREDIT } from "@/lib/brand";

export type ReportItem = { date: string; label: string; meta: string };
export type ReportSection = { title: string; count: number; items: ReportItem[] };

export function JdReportPDF({
  brand,
  scope,
  rangeLabel,
  generatedOn,
  sections,
}: {
  brand: Brand;
  scope: string;
  rangeLabel: string;
  generatedOn: string;
  sections: ReportSection[];
}) {
  const styles = StyleSheet.create({
    page: {
      padding: 48,
      fontSize: 10,
      color: "#1f2937",
      fontFamily: "Helvetica",
      lineHeight: 1.5,
    },
    header: {
      backgroundColor: brand.primary,
      color: "#ffffff",
      padding: 16,
      borderRadius: 6,
      marginBottom: 24,
    },
    brandName: { fontSize: 16, fontFamily: "Helvetica-Bold" },
    title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
    sub: { color: "#6b7280", marginBottom: 20, fontSize: 10 },
    section: { marginBottom: 18 },
    sectionHead: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: brand.primary,
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderColor: "#e5e7eb",
    },
    row: { flexDirection: "row", marginBottom: 4 },
    date: { width: 70, color: "#6b7280" },
    label: { flex: 1, fontFamily: "Helvetica-Bold" },
    meta: { width: 120, color: "#6b7280", textAlign: "right" },
    empty: { color: "#9ca3af", fontStyle: "italic" },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 48,
      right: 48,
      textAlign: "center",
      color: "#9ca3af",
      fontSize: 8,
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.brandName}>{brand.name}</Text>
        </View>

        <Text style={styles.title}>Reporte a la Junta Directiva</Text>
        <Text style={styles.sub}>
          {scope} · {rangeLabel}
        </Text>

        {sections.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionHead}>
              {s.title} ({s.count})
            </Text>
            {s.items.length === 0 ? (
              <Text style={styles.empty}>Sin registros en el período.</Text>
            ) : (
              s.items.map((it, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.date}>{it.date}</Text>
                  <Text style={styles.label}>{it.label}</Text>
                  <Text style={styles.meta}>{it.meta}</Text>
                </View>
              ))
            )}
          </View>
        ))}

        <Text style={styles.footer} fixed>
          Generado el {generatedOn}
          {brand.exportCredit ? ` · ${brand.name} · ${PRODUCT_CREDIT}` : ""}
        </Text>
      </Page>
    </Document>
  );
}
