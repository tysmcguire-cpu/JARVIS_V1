"use client";
import { useEffect, useState } from "react";
import {useAppearance} from '@/features/settings/appearance-provider';
export function InterfaceClock() {
  const {palette}=useAppearance();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    const initial = window.setTimeout(update, 0);
    const interval = window.setInterval(update, 1000);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, []);
  return <div className="interface-clock"><span>LOCAL TIME</span><time dateTime={now?.toISOString()}>{now ? now.toLocaleTimeString([], { hour12: palette.clockFormat==='12h', hour:'2-digit',minute:'2-digit',second:'2-digit' }) : "— : — : —"}</time></div>;
}
