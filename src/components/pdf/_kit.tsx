import { Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";

import type { Brand } from "@/lib/brand";
import { PRODUCT_CREDIT } from "@/lib/brand";

/** Paleta Atrio (guía de marca). El color del tenant entra como acento (brand.primary). */
export const ATRIO = {
  blue: "#2C5BCB",
  deep: "#1A3C86",
  light: "#7B9BE8",
  ink: "#0F1E3D",
  surface: "#FFFFFF",
  bg: "#FBFCFE",
  border: "#EEF1F7",
  text: "#0F1E3D",
  text2: "#5A6680",
  text3: "#8A93A8",
};

/** Símbolo "Prisma" (cubo isométrico) porteado a primitivas de @react-pdf. */
export function AtrioPrisma({ size = 18, white = false }: { size?: number; white?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M 45.64 18.84 Q 50 16.4 54.36 18.84 L 75.24 30.54 Q 79.6 32.99 75.18 35.32 L 54.42 46.27 Q 50 48.6 45.58 46.27 L 24.82 35.32 Q 20.4 32.99 24.76 30.54 Z"
        fill={white ? "#FFFFFF" : ATRIO.light}
      />
      <Path
        d="M 19.8 39.2 Q 19.72 34.2 24.07 36.67 L 44.43 48.22 Q 48.78 50.69 48.86 55.69 L 49.21 78.8 Q 49.29 83.79 45 81.22 L 24.52 68.92 Q 20.24 66.34 20.16 61.34 Z"
        fill={white ? "#FFFFFF" : ATRIO.blue}
      />
      <Path
        d="M 75.93 36.67 Q 80.28 34.2 80.2 39.2 L 79.84 61.34 Q 79.76 66.34 75.48 68.92 L 55 81.22 Q 50.71 83.79 50.79 78.8 L 51.14 55.69 Q 51.22 50.69 55.57 48.22 Z"
        fill={white ? "#FFFFFF" : ATRIO.deep}
      />
    </Svg>
  );
}

/** Compat: docs aún no migrados llaman <AtrioMark h=…/> en headers de color → Prisma blanco. */
export function AtrioMark({ h = 16 }: { h?: number }) {
  return <AtrioPrisma size={h} white />;
}

/** Sistema de estilos moderno (marca Atrio + acento por tenant). */
export function pdfStyles(brand: Brand) {
  const accent = brand.primary;
  return StyleSheet.create({
    page: {
      paddingTop: 42,
      paddingBottom: 64,
      paddingHorizontal: 44,
      fontSize: 9.5,
      color: ATRIO.text,
      fontFamily: "Helvetica",
      lineHeight: 1.5,
    },

    // Encabezado: lockup del PH (cubo + nombre) a la izquierda, eyebrow a la derecha.
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
    lockup: { flexDirection: "row", alignItems: "center" },
    brandName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: ATRIO.ink, marginLeft: 8 },
    headerRight: { alignItems: "flex-end" },
    eyebrow: {
      fontSize: 8,
      letterSpacing: 1.6,
      textTransform: "uppercase",
      color: accent,
      fontFamily: "Helvetica-Bold",
    },
    headerSub: { fontSize: 9, color: ATRIO.text2, marginTop: 2 },
    rule: { height: 2.5, backgroundColor: accent, borderRadius: 2, marginTop: 10, marginBottom: 18 },

    // Título de documento (cuando no va en el eyebrow del header).
    title: { fontSize: 22, fontFamily: "Helvetica-Bold", color: ATRIO.ink, marginBottom: 14, letterSpacing: -0.4 },

    // Tarjeta "hero" (saldo / dato destacado).
    hero: { borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, marginBottom: 18 },
    heroLabel: { fontSize: 8.5, letterSpacing: 1, textTransform: "uppercase", color: "#FFFFFF", opacity: 0.85 },
    heroValue: { fontSize: 28, fontFamily: "Helvetica-Bold", color: "#FFFFFF", lineHeight: 1, marginTop: 8, marginBottom: 8 },
    heroNote: { fontSize: 9, color: "#FFFFFF", opacity: 0.9 },

    // Meta (Edificio / Propietario / Emitido…).
    metaGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
    metaCell: { width: "33.33%", marginBottom: 8, paddingRight: 8 },
    metaLabel: { fontSize: 7.5, color: ATRIO.text3, textTransform: "uppercase", letterSpacing: 0.6 },
    metaValue: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: ATRIO.ink, marginTop: 1 },

    sectionTitle: {
      fontSize: 8,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: ATRIO.text3,
      fontFamily: "Helvetica-Bold",
      marginBottom: 8,
    },

    // Tabla.
    tHead: {
      flexDirection: "row",
      backgroundColor: ATRIO.bg,
      borderRadius: 8,
      paddingVertical: 7,
      paddingHorizontal: 10,
    },
    th: { fontSize: 8, fontFamily: "Helvetica-Bold", color: ATRIO.text2, textTransform: "uppercase", letterSpacing: 0.5 },
    tRow: {
      flexDirection: "row",
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderColor: ATRIO.border,
    },
    td: { fontSize: 10, color: ATRIO.text },
    tdMuted: { fontSize: 10, color: ATRIO.text2 },

    // Totales.
    totals: { marginTop: 14, marginLeft: "auto", width: "55%" },
    totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    totalLabel: { fontSize: 10, color: ATRIO.text2 },
    totalValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: ATRIO.ink },
    grandTotal: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 10,
    },
    grandLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
    grandValue: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },

    note: { marginTop: 16, fontSize: 9, color: ATRIO.text2 },

    // Compat con documentos aún no migrados al sistema nuevo.
    docType: { fontSize: 8, letterSpacing: 1.6, textTransform: "uppercase", color: accent, fontFamily: "Helvetica-Bold", marginBottom: 4 },
    section: { marginTop: 16 },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    rowLabel: { color: ATRIO.text2 },
    rowValue: { fontFamily: "Helvetica-Bold", color: ATRIO.ink },

    // Firmas.
    sign: { marginTop: 54, flexDirection: "row", justifyContent: "space-between" },
    signBox: { width: "45%", borderTopWidth: 1, borderColor: ATRIO.text3, paddingTop: 6, textAlign: "center", fontSize: 9, color: ATRIO.text2 },

    // Pie con el Prisma + crédito.
    footer: {
      position: "absolute",
      bottom: 26,
      left: 44,
      right: 44,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderColor: ATRIO.border,
      paddingTop: 8,
    },
    footerLeft: { flexDirection: "row", alignItems: "center" },
    footerText: { fontSize: 7.5, color: ATRIO.text3, marginLeft: 6 },
    footerPage: { fontSize: 7.5, color: ATRIO.text3 },
  });
}

/** Encabezado de marca reutilizable: lockup del PH + eyebrow del documento. */
export function BrandHeader({
  brand,
  generatedOn,
  docType,
  styles,
}: {
  brand: Brand;
  generatedOn: string;
  docType?: string;
  styles: ReturnType<typeof pdfStyles>;
}) {
  return (
    <>
      <View style={styles.header}>
        <View style={styles.lockup}>
          <AtrioPrisma size={20} />
          <Text style={styles.brandName}>{brand.name}</Text>
        </View>
        <View style={styles.headerRight}>
          {docType ? <Text style={styles.eyebrow}>{docType}</Text> : null}
          <Text style={styles.headerSub}>Emitido el {generatedOn}</Text>
        </View>
      </View>
      <View style={styles.rule} />
    </>
  );
}

/** Pie reutilizable: Prisma + crédito ("‹PH› · Atrio PH · www.atrioph.net · by Nexera") + página. */
export function Footer({
  brand,
  styles,
}: {
  brand: Brand;
  styles: ReturnType<typeof pdfStyles>;
}) {
  return (
    <View style={styles.footer} fixed>
      <View style={styles.footerLeft}>
        <AtrioPrisma size={11} />
        <Text style={styles.footerText}>
          {brand.exportCredit ? `${brand.name} · ${PRODUCT_CREDIT}` : brand.name}
        </Text>
      </View>
      <Text style={styles.footerPage} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}
