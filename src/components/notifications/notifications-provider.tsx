"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

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

/** "Ding" corto generado con Web Audio (sin assets). Silencioso si el navegador bloquea el audio. */
function playDing() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.setValueAtTime(1175, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.start();
    o.stop(ctx.currentTime + 0.42);
    o.onended = () => void ctx.close();
  } catch {
    /* navegador bloqueó el audio sin gesto del usuario: queda silencioso */
  }
}

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
    if (lastUnread.current !== null && unread > lastUnread.current && !mutedRef.current) playDing();
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

  const markRead = useCallback(async (id: string) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
    if (lastUnread.current !== null) lastUnread.current = Math.max(0, lastUnread.current - 1);
    const supabase = createClient();
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  }, []);

  const markAll = useCallback(async () => {
    const ids = items.map((x) => x.id);
    setItems([]);
    lastUnread.current = 0;
    if (ids.length === 0) return;
    const supabase = createClient();
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids);
  }, [items]);

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
