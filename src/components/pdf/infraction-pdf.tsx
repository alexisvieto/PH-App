import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { Brand } from "@/lib/brand";
import { PRODUCT_CREDIT } from "@/lib/brand";

export function InfractionPDF({
  brand,
  buildingName,
  unitCode,
  ownerName,
  typeLabel,
  isMulta,
  reason,
  description,
  amountLabel,
  dueLabel,
  infractionDate,
  generatedOn,
}: {
  brand: Brand;
  buildingName: string;
  unitCode: string;
  ownerName: string | null;
  typeLabel: string;
  isMulta: boolean;
  reason: string;
  description: string | null;
  amountLabel: string | null;
  dueLabel: string | null;
  infractionDate: string;
  generatedOn: string;
}) {
  const styles = StyleSheet.create({
    page: {
      padding: 48,
      fontSize: 11,
      color: "#1f2937",
      fontFamily: "Helvetica",
      lineHeight: 1.6,
    },
    header: {
      backgroundColor: brand.primary,
      color: "#ffffff",
      padding: 16,
      borderRadius: 6,
      marginBottom: 32,
    },
    brandName: { fontSize: 16, fontFamily: "Helvetica-Bold" },
    title: {
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
      textAlign: "center",
      marginBottom: 24,
      letterSpacing: 1,
    },
    row: { flexDirection: "row", marginBottom: 6 },
    label: { width: 120, color: "#6b7280" },
    value: { flex: 1, fontFamily: "Helvetica-Bold" },
    section: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderColor: "#e5e7eb",
    },
    reason: { marginBottom: 8 },
    note: { marginTop: 16, color: "#6b7280", fontSize: 10 },
    sign: { marginTop: 64, alignItems: "center" },
    signLine: {
      borderTopWidth: 1,
      borderColor: "#1f2937",
      width: 220,
      paddingTop: 6,
      textAlign: "center",
    },
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
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brandName}>{brand.name}</Text>
        </View>

        <Text style={styles.title}>{typeLabel.toUpperCase()}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Edificio</Text>
          <Text style={styles.value}>{buildingName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Unidad</Text>
          <Text style={styles.value}>{unitCode}</Text>
        </View>
        {ownerName && (
          <View style={styles.row}>
            <Text style={styles.label}>Propietario</Text>
            <Text style={styles.value}>{ownerName}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Fecha</Text>
          <Text style={styles.value}>{infractionDate}</Text>
        </View>
        {isMulta && amountLabel && (
          <View style={styles.row}>
            <Text style={styles.label}>Monto</Text>
            <Text style={styles.value}>{amountLabel}</Text>
          </View>
        )}
        {isMulta && dueLabel && (
          <View style={styles.row}>
            <Text style={styles.label}>Vence</Text>
            <Text style={styles.value}>{dueLabel}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.reason}>
            Motivo: <Text style={{ fontFamily: "Helvetica-Bold" }}>{reason}</Text>
          </Text>
          {description && <Text>{description}</Text>}
          {isMulta && (
            <Text style={styles.note}>
              Esta multa ha sido cargada al estado de cuenta de la unidad y debe
              cancelarse junto con las demás obligaciones pendientes.
            </Text>
          )}
        </View>

        <View style={styles.sign}>
          <Text style={styles.signLine}>Administración</Text>
        </View>

        <Text style={styles.footer} fixed>
          Emitido el {generatedOn}
          {brand.exportCredit ? ` · ${brand.name} · ${PRODUCT_CREDIT}` : ""}
        </Text>
      </Page>
    </Document>
  );
}
