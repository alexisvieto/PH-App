import { Document, Page, Text, View } from "@react-pdf/renderer";

import { ATRIO, BrandHeader, Footer, pdfStyles } from "@/components/pdf/_kit";
import type { Brand } from "@/lib/brand";

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
  const s = pdfStyles(brand);

  return (
    <Document>
      <Page size="A4" style={[s.page, { paddingHorizontal: 56 }]}>
        <BrandHeader brand={brand} generatedOn={publishedOn} docType={kindLabel} styles={s} />

        <View style={{ marginTop: 44, marginBottom: 36 }}>
          <Text
            style={{
              fontSize: 30,
              fontFamily: "Helvetica-Bold",
              color: ATRIO.ink,
              textAlign: "center",
              letterSpacing: -0.5,
              lineHeight: 1.15,
            }}
          >
            {title}
          </Text>
        </View>

        <Text style={{ fontSize: 14, textAlign: "justify", lineHeight: 1.75, color: ATRIO.text }}>{body}</Text>

        <View style={{ marginTop: 44, paddingTop: 14, borderTopWidth: 1, borderColor: ATRIO.border }}>
          <Text style={{ fontSize: 10.5, color: ATRIO.text2 }}>
            Dirigido a: <Text style={{ fontFamily: "Helvetica-Bold", color: ATRIO.ink }}>{audience}</Text>
          </Text>
          <Text style={{ fontSize: 10.5, color: ATRIO.text2, marginTop: 2 }}>Publicado el {publishedOn}</Text>
        </View>

        <Footer brand={brand} styles={s} />
      </Page>
    </Document>
  );
}
