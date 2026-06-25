import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { Brand } from "@/lib/brand";
import { PRODUCT_CREDIT } from "@/lib/brand";

export function PazSalvoPDF({
  brand,
  buildingName,
  unitCode,
  ownerName,
  generatedOn,
}: {
  brand: Brand;
  buildingName: string;
  unitCode: string;
  ownerName: string | null;
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
      fontSize: 20,
      fontFamily: "Helvetica-Bold",
      textAlign: "center",
      marginBottom: 24,
      letterSpacing: 1,
    },
    body: { textAlign: "justify", marginBottom: 24 },
    bold: { fontFamily: "Helvetica-Bold" },
    date: { marginTop: 8 },
    sign: {
      marginTop: 64,
      alignItems: "center",
    },
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

        <Text style={styles.title}>PAZ Y SALVO</Text>

        <View style={styles.body}>
          <Text>
            Por medio de la presente, la administración de{" "}
            <Text style={styles.bold}>{buildingName}</Text> hace constar que la
            unidad <Text style={styles.bold}>{unitCode}</Text>
            {ownerName ? (
              <Text>
                , a nombre de <Text style={styles.bold}>{ownerName}</Text>
              </Text>
            ) : (
              <Text></Text>
            )}{" "}
            se encuentra <Text style={styles.bold}>a paz y salvo</Text> con la
            administración, sin saldos pendientes por cuotas de mantenimiento,
            cuotas extraordinarias ni multas a la fecha de emisión.
          </Text>
          <Text style={styles.date}>Emitido el {generatedOn}.</Text>
        </View>

        <View style={styles.sign}>
          <Text style={styles.signLine}>Administración</Text>
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
