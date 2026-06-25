import { Document, Page, Text, View } from "@react-pdf/renderer";

import { ATRIO, BrandHeader, Footer, pdfStyles } from "@/components/pdf/_kit";
import type { Brand } from "@/lib/brand";

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
  const s = pdfStyles(brand);
  const bold = { fontFamily: "Helvetica-Bold" as const };

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <BrandHeader brand={brand} generatedOn={generatedOn} docType="Paz y salvo" styles={s} />

        <Text style={[s.title, { textAlign: "center", marginTop: 26 }]}>Paz y Salvo</Text>

        {/* Sello de estado */}
        <View
          style={{
            alignSelf: "center",
            backgroundColor: brand.primary,
            borderRadius: 999,
            paddingVertical: 6,
            paddingHorizontal: 18,
            marginBottom: 30,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 9.5, letterSpacing: 0.8 }}>
            SIN SALDOS PENDIENTES
          </Text>
        </View>

        <View style={{ marginHorizontal: 18 }}>
          <Text style={{ textAlign: "justify", fontSize: 11, lineHeight: 1.7, color: ATRIO.text }}>
            Por medio de la presente, la administración de <Text style={bold}>{buildingName}</Text> hace constar
            que la unidad <Text style={bold}>{unitCode}</Text>
            {ownerName ? (
              <Text>
                , a nombre de <Text style={bold}>{ownerName}</Text>
              </Text>
            ) : null}{" "}
            se encuentra <Text style={{ ...bold, color: brand.primary }}>a paz y salvo</Text> con la administración,
            sin saldos pendientes por cuotas de mantenimiento, cuotas extraordinarias ni multas a la fecha de
            emisión.
          </Text>
          <Text style={{ marginTop: 14, color: ATRIO.text2 }}>Emitido el {generatedOn}.</Text>
        </View>

        <View style={[s.sign, { justifyContent: "center" }]}>
          <View style={s.signBox}>
            <Text>Administración</Text>
          </View>
        </View>

        <Footer brand={brand} styles={s} />
      </Page>
    </Document>
  );
}
