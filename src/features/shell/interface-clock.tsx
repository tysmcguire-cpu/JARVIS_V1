"use client";
import { useEffect, useState } from "react";
export function InterfaceClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    const initial = window.setTimeout(update, 0);
    const interval = window.setInterval(update, 1000);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, []);
  return <div className="interface-clock"><span>LOCAL TIME</span><time dateTime={now?.toISOString()}>{now ? now.toLocaleTimeString([], { hour12: false }) : "— : — : —"}</time></div>;
}
