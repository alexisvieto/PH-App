"use client";

import { useEffect, useRef } from "react";

import { markAnnouncementsRead } from "@/lib/announcements-server";

/** Marca como vistos los comunicados mostrados (fire-and-forget, una vez). */
export function MarkAnnouncementsRead({ ids }: { ids: string[] }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || ids.length === 0) return;
    done.current = true;
    void markAnnouncementsRead(ids);
  }, [ids]);
  return null;
}
