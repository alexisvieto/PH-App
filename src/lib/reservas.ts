import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

export const RESERVATION_STATUS_LABEL: Record<Enums["reservation_status"], string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
};

export const RESERVATION_STATUS_STYLE: Record<Enums["reservation_status"], string> = {
  pendiente: "bg-amber-50 text-amber-700",
  aprobada: "bg-emerald-50 text-emerald-700",
  rechazada: "bg-red-50 text-red-700",
  cancelada: "bg-gray-100 text-gray-500",
};

/** Leyenda del checkbox de aceptación del reglamento (la "firma"). */
export const RULES_ACCEPT_LEGEND =
  "Al marcar esta casilla declaro que acepto las reglas de comportamiento y uso de este área social y estoy de acuerdo con las penalidades descritas en este documento.";

/** Reglamento genérico de muestra (valor por defecto al crear un área). */
export const GENERIC_AREA_RULES = `REGLAMENTO DE USO DEL ÁREA SOCIAL

1. Reserva y horario. El uso del área requiere reserva previa y debe respetarse el horario aprobado de inicio y fin. No se permite el uso fuera del horario reservado.

2. Aforo. No se debe exceder la capacidad máxima del área. El residente responde por el número de invitados.

3. Comportamiento y ruido. Mantener una conducta respetuosa con los demás residentes. Está prohibido el ruido excesivo o la música a alto volumen, en especial después de las 10:00 p. m.

4. Limpieza. El área debe entregarse limpia y en las mismas condiciones en que se recibió. La basura va en los puntos designados.

5. Daños. El residente que reserva es responsable de cualquier daño a las instalaciones, mobiliario o equipos, así como de la conducta de sus invitados.

6. Prohibiciones. No se permite fumar en áreas cerradas, el ingreso de mascotas (salvo autorización) ni actividades que pongan en riesgo la seguridad.

7. Responsabilidad. La administración no se hace responsable por objetos perdidos ni por accidentes derivados del mal uso del área.

MULTAS Y PENALIDADES
Las siguientes multas se cargan al estado de cuenta de la unidad:
- Uso fuera del horario reservado: B/.25.00 por cada hora o fracción.
- Exceder el aforo permitido: B/.50.00.
- Ruido excesivo o queja de vecinos: B/.50.00.
- Entregar el área sucia (limpieza adicional): B/.40.00.
- Daño a mobiliario o equipos: costo de reparación o reposición más B/.25.00.
- Uso sin reserva o de un área bloqueada: B/.75.00.
- Reincidencia: la Junta Directiva podrá suspender el derecho de uso de las áreas sociales.

Al reservar y usar el área, el residente acepta este reglamento y las penalidades aquí descritas.`;

/** 'HH:MM' o 'HH:MM:SS' → '8:00 a. m.' (hora de 12h en español). */
export function fmtTime(t: string): string {
  const [hStr, m] = t.split(":");
  let h = Number(hStr);
  const ap = h < 12 ? "a. m." : "p. m.";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ap}`;
}

/** Minutos desde medianoche para una hora 'HH:MM'. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
