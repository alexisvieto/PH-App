import { redirect } from "next/navigation";

// El padrón se consolidó en Edificios; "Propietarios" lleva al mismo lugar.
export default function PropietariosPage() {
  redirect("/app/edificios");
}
