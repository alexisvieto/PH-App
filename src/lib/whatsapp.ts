// Adaptador de WhatsApp (v1: enlace wa.me, sale del teléfono de la garita).
// Cuando Nexera tenga el WhatsApp Business (un número único, automático), se
// conecta aquí sin tocar el resto.

/** Normaliza un teléfono a dígitos para wa.me. Panamá: 8 dígitos → +507. */
export function waPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (!d) return null;
  if (d.length === 8) d = "507" + d; // local PA sin código de país
  return d;
}

/** Enlace wa.me con mensaje pre-escrito. */
export function buildWaLink(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
