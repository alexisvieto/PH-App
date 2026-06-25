import { Document, Page, Text, View } from "@react-pdf/renderer";

import { ATRIO, BrandHeader, Footer, Subject, pdfStyles } from "@/components/pdf/_kit";
import type { Brand } from "@/lib/brand";

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
  const s = pdfStyles(brand);
  const meta = `${buildingName} · Unidad ${unitCode}${ownerName ? ` · ${ownerName}` : ""}`;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <BrandHeader
          brand={brand}
          generatedOn={generatedOn}
          docType={isMulta ? "Multa" : "Llamado de atención"}
          styles={s}
        />
        <Subject name={brand.name} meta={meta} styles={s} />

        <Text style={[s.title, { marginBottom: 14 }]}>{typeLabel}</Text>

        <View style={s.metaGrid}>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Fecha</Text>
            <Text style={s.metaValue}>{infractionDate}</Text>
          </View>
          {isMulta && amountLabel ? (
            <View style={s.metaCell}>
              <Text style={s.metaLabel}>Monto</Text>
              <Text style={[s.metaValue, { color: brand.primary }]}>{amountLabel}</Text>
            </View>
          ) : null}
          {isMulta && dueLabel ? (
            <View style={s.metaCell}>
              <Text style={s.metaLabel}>Vence</Text>
              <Text style={s.metaValue}>{dueLabel}</Text>
            </View>
          ) : null}
        </View>

        <Text style={s.sectionTitle}>Motivo</Text>
        <Text style={{ fontFamily: "Helvetica-Bold", color: ATRIO.ink, marginBottom: 6 }}>{reason}</Text>
        {description ? <Text style={{ color: ATRIO.text, lineHeight: 1.6 }}>{description}</Text> : null}
        {isMulta ? (
          <Text style={s.note}>
            Esta multa ha sido cargada al estado de cuenta de la unidad y debe cancelarse junto con las demás
            obligaciones pendientes.
          </Text>
        ) : null}

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
