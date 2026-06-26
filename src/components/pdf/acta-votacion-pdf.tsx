import { Document, Page, Text, View } from "@react-pdf/renderer";

import type { Brand } from "@/lib/brand";
import type { Tally } from "@/lib/votations";
import { ATRIO, BrandHeader, Footer, pdfStyles } from "@/components/pdf/_kit";

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
  votes: { unit_code: string; choice: string; voted_at: string }[];
};

export function ActaVotacionPDF({ data, brand }: { data: ActaData; brand: Brand }) {
  const s = pdfStyles(brand);
  const t = data.tally;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <BrandHeader brand={brand} generatedOn={data.generatedOn} docType="Acta de votación" styles={s} />

        <Text style={s.title}>{data.title}</Text>
        {data.description ? <Text style={{ marginBottom: 12, color: ATRIO.text2 }}>{data.description}</Text> : null}

        <View style={s.metaGrid}>
          <Meta s={s} label="Edificio" value={data.buildingName} />
          <Meta s={s} label="Tipo" value={data.kindLabel} />
          <Meta s={s} label="Abrió" value={data.opensAt} />
          <Meta s={s} label="Cerró" value={data.closesAt} />
          <Meta s={s} label="Unidades al día (electorado)" value={String(t.eligibleUnits)} />
          <Meta s={s} label="Participación" value={`${pct(t.participationPct)} (${t.votedUnits}/${t.eligibleUnits})`} />
          <Meta s={s} label="Quórum requerido" value={`${pct(data.quorumPct)} · ${t.quorumReached ? "alcanzado" : "no alcanzado"}`} />
          <Meta s={s} label="Umbral de aprobación" value={pct(data.approvalPct)} />
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
          <Text style={s.sectionTitle}>Resultado por opción (unidades al día)</Text>
          {t.options.map((o) => (
            <View style={s.row} key={o.id}>
              <Text style={s.rowLabel}>{o.label}</Text>
              <Text style={s.rowValue}>{o.count} · {pct(o.pct)}</Text>
            </View>
          ))}
        </View>

        {/* Detalle nominal */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Detalle por unidad</Text>
          <View style={s.tHead}>
            <Text style={[s.th, { width: "40%" }]}>Unidad</Text>
            <Text style={[s.th, { width: "38%" }]}>Voto</Text>
            <Text style={[s.th, { width: "22%", textAlign: "right" }]}>Fecha</Text>
          </View>
          {data.votes.length === 0 ? (
            <Text style={{ paddingVertical: 7, color: ATRIO.text3 }}>Nadie votó.</Text>
          ) : (
            data.votes.map((v, i) => (
              <View key={i} style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: ATRIO.border, paddingVertical: 5 }} wrap={false}>
                <Text style={{ width: "40%", paddingHorizontal: 4 }}>{v.unit_code}</Text>
                <Text style={{ width: "38%", paddingHorizontal: 4 }}>{v.choice}</Text>
                <Text style={{ width: "22%", paddingHorizontal: 4, textAlign: "right" }}>{v.voted_at}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={s.note}>
          Acta generada automáticamente por {brand.name}. Conforme a la Ley 284, cada unidad inmobiliaria
          al día en gastos comunes equivale a un voto.
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
