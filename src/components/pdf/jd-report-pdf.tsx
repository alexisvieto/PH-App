import { Document, Page, Text, View } from "@react-pdf/renderer";

import { ATRIO, BrandHeader, Footer, Subject, pdfStyles } from "@/components/pdf/_kit";
import type { Brand } from "@/lib/brand";

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
  const s = pdfStyles(brand);

  return (
    <Document>
      <Page size="A4" style={s.page} wrap>
        <BrandHeader brand={brand} generatedOn={generatedOn} docType="Reporte a la Junta" styles={s} />
        <Subject name={brand.name} meta={`${scope} · ${rangeLabel}`} styles={s} />

        {sections.map((sec) => (
          <View key={sec.title} style={{ marginBottom: 18 }} wrap={false}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottomWidth: 1,
                borderColor: ATRIO.ink,
                paddingBottom: 5,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 10.5, fontFamily: "Helvetica-Bold", color: ATRIO.ink }}>{sec.title}</Text>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: brand.primary }}>{sec.count}</Text>
            </View>
            {sec.items.length === 0 ? (
              <Text style={{ color: ATRIO.text3, fontStyle: "italic" }}>Sin registros en el período.</Text>
            ) : (
              sec.items.map((it, i) => (
                <View
                  key={i}
                  style={{ flexDirection: "row", paddingVertical: 5, borderBottomWidth: 1, borderColor: ATRIO.border }}
                >
                  <Text style={{ width: 70, color: ATRIO.text2 }}>{it.date}</Text>
                  <Text style={{ flex: 1, color: ATRIO.text }}>{it.label}</Text>
                  <Text style={{ width: 130, color: ATRIO.text2, textAlign: "right" }}>{it.meta}</Text>
                </View>
              ))
            )}
          </View>
        ))}

        <Footer brand={brand} styles={s} />
      </Page>
    </Document>
  );
}
