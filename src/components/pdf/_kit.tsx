import { Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";

import type { Brand } from "@/lib/brand";
import { PRODUCT_CREDIT } from "@/lib/brand";

/** Paleta Atrio (guía de marca). El color del tenant entra como acento sutil (brand.primary). */
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

/** Lockup de Atrio: cubo + wordmark "atrio." (minúsculas, punto azul) + slogan opcional. */
export function AtrioLockup({ size = 20, tagline = true }: { size?: number; tagline?: boolean }) {
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <AtrioPrisma size={size} />
        <Text
          style={{
            marginLeft: 8,
            fontSize: size * 0.95,
            fontFamily: "Helvetica-Bold",
            color: ATRIO.ink,
            letterSpacing: -0.4,
          }}
        >
          atrio<Text style={{ color: ATRIO.blue }}>.</Text>
        </Text>
      </View>
      {tagline ? (
        <Text style={{ fontSize: 6.5, letterSpacing: 1.3, color: ATRIO.text3, marginTop: 3, marginLeft: 1 }}>
          ONE APP. ONE COMMUNITY.
        </Text>
      ) : null}
    </View>
  );
}

/** Compat: docs aún no migrados llaman <AtrioMark h=…/> → cubo Prisma. */
export function AtrioMark({ h = 16 }: { h?: number }) {
  return <AtrioPrisma size={h} white />;
}

/** Sistema de estilos corporativo (marca Atrio; el color del tenant entra como acento). */
export function pdfStyles(brand: Brand) {
  const accent = brand.primary;
  return StyleSheet.create({
    page: {
      paddingTop: 40,
      paddingBottom: 60,
      paddingHorizontal: 46,
      fontSize: 9.5,
      color: ATRIO.text,
      fontFamily: "Helvetica",
      lineHeight: 1.5,
    },

    // Header corporativo: lockup de Atrio (izq) + eyebrow del documento (der).
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    headerRight: { alignItems: "flex-end" },
    eyebrow: { fontSize: 8.5, letterSpacing: 1.6, textTransform: "uppercase", color: ATRIO.blue, fontFamily: "Helvetica-Bold" },
    headerSub: { fontSize: 9, color: ATRIO.text2, marginTop: 3 },
    rule: { height: 1.4, backgroundColor: ATRIO.ink, marginTop: 12, marginBottom: 18 },

    // Sujeto del documento: el edificio/PH (debajo del header de Atrio).
    subjectRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 },
    subjectName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: ATRIO.ink, letterSpacing: -0.3 },
    subjectMeta: { fontSize: 9.5, color: ATRIO.text2, marginTop: 3 },
    saldoBox: { alignItems: "flex-end" },
    saldoLabel: { fontSize: 7.5, letterSpacing: 0.8, textTransform: "uppercase", color: ATRIO.text3 },
    saldoValue: { fontSize: 18, fontFamily: "Helvetica-Bold", lineHeight: 1, marginTop: 3, marginBottom: 3 },
    saldoNote: { fontSize: 8.5, color: ATRIO.text2 },

    // Título (cartas/certificados).
    title: { fontSize: 20, fontFamily: "Helvetica-Bold", color: ATRIO.ink, letterSpacing: -0.3, marginBottom: 12 },

    // Meta en grilla.
    metaGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
    metaCell: { width: "33.33%", marginBottom: 8, paddingRight: 8 },
    metaLabel: { fontSize: 7.5, color: ATRIO.text3, textTransform: "uppercase", letterSpacing: 0.6 },
    metaValue: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: ATRIO.ink, marginTop: 1 },

    sectionTitle: { fontSize: 8, letterSpacing: 1.4, textTransform: "uppercase", color: ATRIO.text3, fontFamily: "Helvetica-Bold", marginBottom: 8 },

    // Tabla limpia.
    tHead: { flexDirection: "row", borderBottomWidth: 1.2, borderColor: ATRIO.ink, paddingBottom: 6, paddingHorizontal: 2 },
    th: { fontSize: 8, fontFamily: "Helvetica-Bold", color: ATRIO.text2, textTransform: "uppercase", letterSpacing: 0.5 },
    tRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 2, borderBottomWidth: 1, borderColor: ATRIO.border },
    td: { fontSize: 10, color: ATRIO.text },
    tdMuted: { fontSize: 10, color: ATRIO.text2 },

    // Totales (resumen sobrio, Saldo en caja con contorno — sin banda de color).
    totals: { marginTop: 16, marginLeft: "auto", width: "52%" },
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
      borderRadius: 8,
      borderWidth: 1.4,
      borderColor: accent,
    },
    grandLabel: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: ATRIO.ink },
    grandValue: { fontSize: 15, fontFamily: "Helvetica-Bold", color: accent },

    note: { marginTop: 16, fontSize: 9, color: ATRIO.text2 },

    // Firmas.
    sign: { marginTop: 54, flexDirection: "row", justifyContent: "space-between" },
    signBox: { width: "45%", borderTopWidth: 1, borderColor: ATRIO.text3, paddingTop: 6, textAlign: "center", fontSize: 9, color: ATRIO.text2 },

    // Pie: cubo + crédito (‹PH› · Atrio · www.atrioph.net · by Nexera) + página.
    footer: {
      position: "absolute",
      bottom: 24,
      left: 46,
      right: 46,
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

    // Compat con documentos aún no migrados.
    docType: { fontSize: 8.5, letterSpacing: 1.6, textTransform: "uppercase", color: ATRIO.blue, fontFamily: "Helvetica-Bold", marginBottom: 4 },
    section: { marginTop: 16 },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    rowLabel: { color: ATRIO.text2 },
    rowValue: { fontFamily: "Helvetica-Bold", color: ATRIO.ink },
  });
}

/** Header corporativo: lockup de Atrio + eyebrow del documento + regla. */
export function BrandHeader({
  generatedOn,
  docType,
  styles,
}: {
  brand?: Brand;
  generatedOn: string;
  docType?: string;
  styles: ReturnType<typeof pdfStyles>;
}) {
  return (
    <>
      <View style={styles.header}>
        <AtrioLockup size={20} />
        <View style={styles.headerRight}>
          {docType ? <Text style={styles.eyebrow}>{docType}</Text> : null}
          <Text style={styles.headerSub}>Emitido el {generatedOn}</Text>
        </View>
      </View>
      <View style={styles.rule} />
    </>
  );
}

/** Bloque "sujeto": el edificio/PH debajo del header de Atrio (+ línea de meta). */
export function Subject({
  name,
  meta,
  styles,
}: {
  name: string;
  meta?: string;
  styles: ReturnType<typeof pdfStyles>;
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.subjectName}>{name}</Text>
      {meta ? <Text style={styles.subjectMeta}>{meta}</Text> : null}
    </View>
  );
}

/** Pie: cubo + crédito + página. */
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
        <AtrioPrisma size={10} />
        <Text style={styles.footerText}>
          {brand.exportCredit ? `${brand.name} · ${PRODUCT_CREDIT}` : brand.name}
        </Text>
      </View>
      <Text style={styles.footerPage} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}
