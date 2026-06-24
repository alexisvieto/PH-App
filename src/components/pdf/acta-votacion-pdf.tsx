import { Document, Page, Text, View } from "@react-pdf/renderer";

import type { Brand } from "@/lib/brand";
import type { Tally } from "@/lib/votations";
import { BrandHeader, Footer, pdfStyles } from "@/components/pdf/_kit";

const pct = (n: number) => `${n.toFixed(1)}%`;

const DECISION_LABEL: Record<Tally["decision"], string> = {
  aprobada: "APROBADA",
  rechazada: "RECHAZADA",
  sin_quorum: "SIN QUÓRUM",
};

export type ActaData = {
  title: string;
  description: string | null;
  buildingName: string;
  kindLabel: string;
  opensAt: string;
  closesAt: string;
  quorumPct: number;
  approvalPct: number;
  generatedOn: string;
  tally: Tally;
  votes: { unit_code: string; choice: string; coef: string; voted_at: string }[];
};

export function ActaVotacionPDF({ data, brand }: { data: ActaData; brand: Brand }) {
  const s = pdfStyles(brand);
  const t = data.tally;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <BrandHeader brand={brand} generatedOn={data.generatedOn} styles={s} />

        <Text style={s.docType}>Acta de votación</Text>
        <Text style={s.title}>{data.title}</Text>
        {data.description ? <Text style={{ marginBottom: 12, color: "#374151" }}>{data.description}</Text> : null}

        <View style={s.metaGrid}>
          <Meta s={s} label="Edificio" value={data.buildingName} />
          <Meta s={s} label="Tipo" value={data.kindLabel} />
          <Meta s={s} label="Abrió" value={data.opensAt} />
          <Meta s={s} label="Cerró" value={data.closesAt} />
          <Meta s={s} label="Quórum requerido" value={pct(data.quorumPct)} />
          <Meta s={s} label="Participación (coeficiente)" value={pct(t.participationPct)} />
          <Meta s={s} label="Umbral de aprobación" value={pct(data.approvalPct)} />
          <Meta s={s} label="Quórum" value={t.quorumReached ? "Alcanzado" : "No alcanzado"} />
        </View>

        {/* Decisión */}
        <View style={{ marginTop: 8, marginBottom: 4, flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 13 }}>Decisión: </Text>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 13, color: brand.primary }}>
            {DECISION_LABEL[t.decision]}
          </Text>
        </View>

        {/* Resultado por opción */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Resultado por opción (ponderado por coeficiente)</Text>
          {t.options.map((o) => (
            <View style={s.row} key={o.id}>
              <Text style={s.rowLabel}>{o.label}</Text>
              <Text style={s.rowValue}>{pct(o.pct)}</Text>
            </View>
          ))}
        </View>

        {/* Detalle nominal */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Detalle por unidad</Text>
          <View style={{ flexDirection: "row", backgroundColor: "#f3f4f6", paddingVertical: 5, fontFamily: "Helvetica-Bold" }}>
            <Text style={{ width: "30%", paddingHorizontal: 4 }}>Unidad</Text>
            <Text style={{ width: "35%", paddingHorizontal: 4 }}>Voto</Text>
            <Text style={{ width: "17%", paddingHorizontal: 4, textAlign: "right" }}>Coef.</Text>
            <Text style={{ width: "18%", paddingHorizontal: 4, textAlign: "right" }}>Fecha</Text>
          </View>
          {data.votes.length === 0 ? (
            <Text style={{ paddingVertical: 6, color: "#9ca3af" }}>Nadie votó.</Text>
          ) : (
            data.votes.map((v, i) => (
              <View key={i} style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: "#e5e7eb", paddingVertical: 4 }} wrap={false}>
                <Text style={{ width: "30%", paddingHorizontal: 4 }}>{v.unit_code}</Text>
                <Text style={{ width: "35%", paddingHorizontal: 4 }}>{v.choice}</Text>
                <Text style={{ width: "17%", paddingHorizontal: 4, textAlign: "right" }}>{v.coef}</Text>
                <Text style={{ width: "18%", paddingHorizontal: 4, textAlign: "right" }}>{v.voted_at}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={s.note}>
          Acta generada automáticamente por {brand.name}. La votación se ponderó por el coeficiente de
          participación de cada unidad.
        </Text>

        <Footer brand={brand} styles={s} />
      </Page>
    </Document>
  );
}

function Meta({ s, label, value }: { s: ReturnType<typeof pdfStyles>; label: string; value: string }) {
  return (
    <View style={s.metaCell}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={s.metaValue}>{value}</Text>
    </View>
  );
}
