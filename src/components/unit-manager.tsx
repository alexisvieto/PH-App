"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import {
  createLease,
  endLease,
  transferOwnership,
} from "@/app/app/edificios/[buildingId]/unidades/actions";
import { SubmitButton } from "@/components/submit-button";
import { useFormPanel } from "@/components/use-form-panel";
import { EMPTY_ACTION_STATE } from "@/lib/action-state";
import { formatDate, formatMoney } from "@/lib/format";

export type PersonOpt = { id: string; full_name: string };
export type OwnershipRow = {
  id: string;
  acquired_on: string | null;
  ended_on: string | null;
  is_active: boolean;
  name: string;
};
export type LeaseRow = {
  id: string;
  tenant: string;
  start_date: string | null;
  rent_amount: number | null;
} | null;

const input =
  "w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand bg-white";

export function UnitManager({
  unitId,
  history,
  lease,
  people,
}: {
  unitId: string;
  history: OwnershipRow[];
  lease: LeaseRow;
  people: PersonOpt[];
}) {
  const currentOwner = history.find((h) => h.is_active) ?? null;
  const noPeople = people.length === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <OwnershipPanel
        unitId={unitId}
        currentOwner={currentOwner}
        history={history}
        people={people}
        noPeople={noPeople}
      />
      <LeasePanel unitId={unitId} lease={lease} people={people} noPeople={noPeople} />
    </div>
  );
}

function PeopleHint() {
  return (
    <p className="text-sm text-muted">
      Primero registra personas en{" "}
      <Link href="/app/personas" className="text-brand hover:underline">
        Personas
      </Link>
      .
    </p>
  );
}

function OwnershipPanel({
  unitId,
  currentOwner,
  history,
  people,
  noPeople,
}: {
  unitId: string;
  currentOwner: OwnershipRow | null;
  history: OwnershipRow[];
  people: PersonOpt[];
  noPeople: boolean;
}) {
  const [state, action] = useActionState(transferOwnership, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(state, "Titularidad actualizada.");

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Titularidad</h2>
      <p className="mt-1 text-sm">
        Propietario actual:{" "}
        <span className="font-medium">
          {currentOwner ? currentOwner.name : "Sin propietario"}
        </span>
      </p>

      <div className="mt-4">
        {noPeople ? (
          <PeopleHint />
        ) : !open ? (
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg border border-brand px-3 py-1.5 text-sm font-medium text-brand transition hover:bg-brand-soft/40"
          >
            {currentOwner ? "Transferir (venta)" : "Asignar propietario"}
          </button>
        ) : (
          <form action={action} className="space-y-3">
            <input type="hidden" name="unit_id" value={unitId} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                {currentOwner ? "Nuevo propietario" : "Propietario"}
              </span>
              <select name="person_id" required className={input}>
                <option value="">Selecciona…</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Fecha de adquisición</span>
              <input type="date" name="acquired_on" className={input} />
            </label>
            {state.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {state.error}
              </p>
            )}
            <div className="flex gap-2">
              <SubmitButton pendingText="Guardando…">Confirmar</SubmitButton>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-ink"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {history.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium uppercase text-muted">
            Historial
          </p>
          <ul className="space-y-2">
            {history.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between text-sm"
              >
                <span>{h.name}</span>
                <span className="text-muted">
                  {formatDate(h.acquired_on)} →{" "}
                  {h.is_active ? (
                    <span className="text-emerald-600">vigente</span>
                  ) : (
                    formatDate(h.ended_on)
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function LeasePanel({
  unitId,
  lease,
  people,
  noPeople,
}: {
  unitId: string;
  lease: LeaseRow;
  people: PersonOpt[];
  noPeople: boolean;
}) {
  const [createState, createAction] = useActionState(createLease, EMPTY_ACTION_STATE);
  const [open, setOpen] = useFormPanel(createState, "Arrendamiento registrado.");
  const [endState, endAction] = useActionState(endLease, EMPTY_ACTION_STATE);

  useEffect(() => {
    if (endState.ok) toast.success("Arrendamiento terminado.");
  }, [endState]);

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Arrendamiento</h2>

      {lease ? (
        <div className="mt-1 space-y-1 text-sm">
          <p>
            Inquilino: <span className="font-medium">{lease.tenant}</span>
          </p>
          <p className="text-muted">
            Desde {formatDate(lease.start_date)} ·{" "}
            {lease.rent_amount != null
              ? `${formatMoney(lease.rent_amount)}/mes`
              : "sin canon"}
          </p>
          <form action={endAction} className="pt-2">
            <input type="hidden" name="unit_id" value={unitId} />
            <SubmitButton
              pendingText="Terminando…"
              className="bg-red-600 hover:bg-red-700"
            >
              Terminar arrendamiento
            </SubmitButton>
          </form>
          {endState.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {endState.error}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <p className="mb-3 text-sm text-muted">Esta unidad no está alquilada.</p>
          {noPeople ? (
            <PeopleHint />
          ) : !open ? (
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg border border-brand px-3 py-1.5 text-sm font-medium text-brand transition hover:bg-brand-soft/40"
            >
              Registrar arrendamiento
            </button>
          ) : (
            <form action={createAction} className="space-y-3">
              <input type="hidden" name="unit_id" value={unitId} />
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Inquilino</span>
                <select name="tenant_person_id" required className={input}>
                  <option value="">Selecciona…</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Inicio</span>
                  <input type="date" name="start_date" className={input} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">Canon (USD)</span>
                  <input
                    type="number"
                    name="rent_amount"
                    step="0.01"
                    min="0"
                    className={input}
                    placeholder="Opcional"
                  />
                </label>
              </div>
              {createState.error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {createState.error}
                </p>
              )}
              <div className="flex gap-2">
                <SubmitButton pendingText="Guardando…">Registrar</SubmitButton>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-ink"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
