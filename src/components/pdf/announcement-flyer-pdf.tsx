import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { Brand } from "@/lib/brand";
import { PRODUCT_CREDIT } from "@/lib/brand";

export function AnnouncementFlyerPDF({
  brand,
  title,
  body,
  audience,
  kindLabel,
  publishedOn,
}: {
  brand: Brand;
  title: string;
  body: string;
  audience: string;
  kindLabel: string;
  publishedOn: string;
}) {
  const styles = StyleSheet.create({
    page: {
      padding: 56,
      color: "#1f2937",
      fontFamily: "Helvetica",
      lineHeight: 1.5,
    },
    header: {
      backgroundColor: brand.primary,
      color: "#ffffff",
      padding: 20,
      borderRadius: 8,
      marginBottom: 40,
      textAlign: "center",
    },
    brandName: { fontSize: 22, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
    kind: {
      fontSize: 12,
      color: brand.primary,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      letterSpacing: 2,
      marginBottom: 12,
      textAlign: "center",
    },
    title: {
      fontSize: 30,
      fontFamily: "Helvetica-Bold",
      textAlign: "center",
      marginBottom: 32,
    },
    body: { fontSize: 16, textAlign: "justify", lineHeight: 1.7 },
    meta: {
      marginTop: 48,
      paddingTop: 16,
      borderTopWidth: 1,
      borderColor: "#e5e7eb",
      fontSize: 11,
      color: "#6b7280",
    },
    footer: {
      position: "absolute",
      bottom: 28,
      left: 56,
      right: 56,
      textAlign: "center",
      color: "#9ca3af",
      fontSize: 9,
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brandName}>{brand.name}</Text>
        </View>

        <Text style={styles.kind}>{kindLabel}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>

        <View style={styles.meta}>
          <Text>Dirigido a: {audience}</Text>
          <Text>Publicado el {publishedOn}</Text>
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
