import {
  CONTRACT_TYPE_OPTIONS,
  PAY_FREQUENCY_OPTIONS,
  WORK_SHIFT_OPTIONS,
} from "@/lib/payroll/labels";
import type { Database } from "@/lib/supabase/database.types";

type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

/** Campos comunes de empleado (alta y edición). El salario base va aparte. */
export function EmployeeFormFields({
  buildings,
  d,
}: {
  buildings: { id: string; name: string }[];
  d?: EmployeeRow | null;
}) {
  const v = (x: string | number | null | undefined) => (x === null || x === undefined ? "" : String(x));
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-sm font-medium">Nombre completo</span>
        <input name="full_name" required defaultValue={v(d?.full_name)} className={input} placeholder="Ej. José Martínez" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Cédula</span>
        <input name="national_id" defaultValue={v(d?.national_id)} className={input} placeholder="Opcional" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Cargo</span>
        <input name="position" defaultValue={v(d?.position)} className={input} placeholder="Ej. Conserje" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Edificio</span>
        <select name="building_id" defaultValue={v(d?.building_id)} className={input}>
          <option value="">Sin asignar</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Fecha de inicio de labores</span>
        <input name="hire_date" type="date" required defaultValue={v(d?.hire_date)} className={input} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Fecha de nacimiento</span>
        <input name="birth_date" type="date" defaultValue={v(d?.birth_date)} className={input} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Sexo</span>
        <select name="sex" defaultValue={v(d?.sex)} className={input}>
          <option value="">Sin especificar</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="otro">Otro</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Teléfono</span>
        <input name="phone" defaultValue={v(d?.phone)} className={input} placeholder="Opcional" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Correo</span>
        <input name="email" type="email" defaultValue={v(d?.email)} className={input} placeholder="Opcional" />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-sm font-medium">Dirección</span>
        <input name="address" defaultValue={v(d?.address)} className={input} placeholder="Opcional" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">N° de Seguro Social (CSS)</span>
        <input name="social_security_no" defaultValue={v(d?.social_security_no)} className={input} placeholder="Opcional" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Frecuencia de pago</span>
        <select name="pay_frequency" defaultValue={d?.pay_frequency ?? "quincenal"} className={input}>
          {PAY_FREQUENCY_OPTIONS.map(([val, l]) => <option key={val} value={val}>{l}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Tipo de contrato</span>
        <select name="contract_type" defaultValue={d?.contract_type ?? "indefinido"} className={input}>
          {CONTRACT_TYPE_OPTIONS.map(([val, l]) => <option key={val} value={val}>{l}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Jornada</span>
        <select name="work_shift" defaultValue={d?.work_shift ?? "diurna"} className={input}>
          {WORK_SHIFT_OPTIONS.map(([val, l]) => <option key={val} value={val}>{l}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Vencimiento de contrato</span>
        <input name="contract_end_date" type="date" defaultValue={v(d?.contract_end_date)} className={input} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Riesgo profesional (% patronal)</span>
        <input name="risk_premium_pct" type="number" min="0" max="15" step="0.01" defaultValue={v(d?.risk_premium_pct ?? 0)} className={input} />
      </label>

      <p className="mt-2 text-sm font-medium text-muted sm:col-span-2">Contacto de emergencia</p>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Nombre</span>
        <input name="emergency_contact_name" defaultValue={v(d?.emergency_contact_name)} className={input} placeholder="Opcional" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Teléfono</span>
        <input name="emergency_contact_phone" defaultValue={v(d?.emergency_contact_phone)} className={input} placeholder="Opcional" />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-sm font-medium">Parentesco</span>
        <input name="emergency_contact_relationship" defaultValue={v(d?.emergency_contact_relationship)} className={input} placeholder="Ej. Cónyuge, hijo/a" />
      </label>

      <p className="mt-2 text-sm font-medium text-muted sm:col-span-2">Datos de pago</p>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Banco</span>
        <input name="bank_name" defaultValue={v(d?.bank_name)} className={input} placeholder="Opcional" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">N° de cuenta</span>
        <input name="bank_account" defaultValue={v(d?.bank_account)} className={input} placeholder="Opcional" />
      </label>

      <label className="flex items-center gap-2 sm:col-span-2">
        <input name="declares_dependents" type="checkbox" defaultChecked={d?.declares_dependents ?? false} className="size-4" />
        <span className="text-sm">Declara dependientes (deducción ISR de B/.800 anuales)</span>
      </label>
    </div>
  );
}
