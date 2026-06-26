"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { playChime } from "@/lib/alert-sound";
import { createClient } from "@/lib/supabase/client";

export type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
  read_at: string | null;
};

type Ctx = {
  items: Notif[]; // solo no leídas
  unread: number;
  muted: boolean;
  toggleMute: () => void;
  markRead: (id: string) => Promise<void>;
  markAll: () => Promise<void>;
};

const NotificationsContext = createContext<Ctx | null>(null);

export function useNotifications(): Ctx {
  const c = useContext(NotificationsContext);
  if (!c) throw new Error("useNotifications fuera de NotificationsProvider");
  return c;
}

const MUTE_KEY = "atrio.notif.muted";

export function NotificationsProvider({ orgId, children }: { orgId: string | null; children: React.ReactNode }) {
  const [items, setItems] = useState<Notif[]>([]);
  const [muted, setMuted] = useState(false);
  const lastUnread = useRef<number | null>(null);
  const mutedRef = useRef(false);

  useEffect(() => {
    const m = localStorage.getItem(MUTE_KEY) === "1";
    // Lectura de preferencia client-only (hidratación): set único al montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMuted(m);
    mutedRef.current = m;
  }, []);

  const reload = useCallback(async () => {
    if (!orgId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, link, created_at, read_at")
      .eq("organization_id", orgId)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(40);
    const list = (data ?? []) as Notif[];
    const unread = list.length;
    if (lastUnread.current !== null && unread > lastUnread.current && !mutedRef.current) playChime();
    lastUnread.current = unread;
    setItems(list);
  }, [orgId]);

  useEffect(() => {
    // Carga de notificaciones (fetch legítimo, el setState ocurre tras el await), no estado derivado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void reload();
    }, 25000);
    const onFocus = () => void reload();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [reload]);

  const markRead = useCallback(
    async (id: string) => {
      setItems((xs) => xs.filter((x) => x.id !== id));
      if (lastUnread.current !== null) lastUnread.current = Math.max(0, lastUnread.current - 1);
      if (!orgId) return;
      const supabase = createClient();
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("organization_id", orgId);
    },
    [orgId],
  );

  const markAll = useCallback(async () => {
    const ids = items.map((x) => x.id);
    setItems([]);
    lastUnread.current = 0;
    if (ids.length === 0 || !orgId) return;
    const supabase = createClient();
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids).eq("organization_id", orgId);
    void reload(); // resincroniza por si llegaron nuevas mientras se marcaban
  }, [items, orgId, reload]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const nv = !m;
      mutedRef.current = nv;
      localStorage.setItem(MUTE_KEY, nv ? "1" : "0");
      return nv;
    });
  }, []);

  return (
    <NotificationsContext.Provider value={{ items, unread: items.length, muted, toggleMute, markRead, markAll }}>
      {children}
    </NotificationsContext.Provider>
  );
}
