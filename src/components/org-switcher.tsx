"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronsUpDown } from "lucide-react";

import { setActiveOrg } from "@/app/app/actions";

export type OrgOption = { id: string; name: string };

export function OrgSwitcher({
  options,
  activeId,
}: {
  options: OrgOption[];
  activeId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="relative mt-3">
      <select
        value={activeId}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          if (next === activeId) return;
          start(async () => {
            await setActiveOrg(next);
            router.refresh();
          });
        }}
        className="w-full appearance-none rounded-lg border border-line bg-white px-3 py-2 pr-8 text-sm outline-none focus:border-brand disabled:opacity-60"
        aria-label="Cambiar organización"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <ChevronsUpDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
}
