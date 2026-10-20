"use client";
import { useEffect, useRef } from "react";
import {useAppearance} from "@/features/settings/appearance-provider";

/** Original, decorative light ribbons. No AI activity or external telemetry. */
export function FlowingCore({ paused }: { paused: boolean }) {
  const {palette}=useAppearance();
  const ref = useRef<HTMLCanvasElement>(null);
  const elapsedRef = useRef(0);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastFrame = -Infinity;
    let elapsed = elapsedRef.current;
    let lastTime: number | null = null;
    let stopped = false;
    const render = (time: number) => {
      context.clearRect(0, 0, 600, 600);
      context.globalCompositeOperation = "lighter";
      for (let band = 0; band < 3; band++) {
        const gradient = context.createLinearGradient(100, 80, 510, 520);
        gradient.addColorStop(0, band === 2 ? palette.secondaryColor : palette.primaryColor);
        gradient.addColorStop(.5, band === 1 ? palette.secondaryColor : palette.primaryColor);
        gradient.addColorStop(1, band === 2 ? palette.secondaryColor : palette.primaryColor);
        context.strokeStyle = gradient;
        for (let strand = 0; strand < 14; strand++) {
          const phase = band * 2.05 + strand * .022;
          context.beginPath();
          for (let step = 0; step <= 120; step++) {
            const angle = step / 120 * Math.PI * 2;
            const radius = 197 + strand * 1.8 + 23 * Math.sin(angle * 3 + time * .48 + phase) + 14 * Math.sin(angle * 5 - time * .3 + phase);
            const twist = angle + .12 * Math.sin(angle * 2 + time * .22 + phase);
            const x = 300 + Math.cos(twist) * radius * (1 + .08 * Math.sin(time * .18 + phase));
            const y = 300 + Math.sin(twist) * radius * .98 + 12 * Math.sin(angle * 2 - time * .35 + phase);
            if (!step) context.moveTo(x, y); else context.lineTo(x, y);
          }
          context.closePath();
          context.globalAlpha = band === 2 ? .38 : .55;
          context.lineWidth = strand % 5 === 0 ? 1.5 : .8;
          context.stroke();
        }
      }
      context.globalAlpha = .3;
      context.strokeStyle = palette.secondaryColor;
      context.lineWidth = .7;
      for (let i = 0; i < 24; i++) {
        const angle = i * Math.PI / 12;
        const distance = 105 + (i % 4) * 14;
        const x = 300 + Math.cos(angle) * distance;
        const y = 300 + Math.sin(angle) * distance;
        context.beginPath(); context.moveTo(x, y);
        context.lineTo(x + Math.cos(angle) * 30, y + Math.sin(angle) * 30);
        context.lineTo(x + Math.cos(angle) * 50 + (i % 2 ? 15 : -15), y + Math.sin(angle) * 60);
        context.stroke();
        context.fillStyle = i % 3 ? palette.primaryColor : palette.secondaryColor;
        context.beginPath(); context.arc(x, y, 1.4 + .4 * Math.sin(time + i), 0, Math.PI * 2); context.fill();
      }
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
    };
    const resize = () => {
      const resolution = Math.max(300, Math.round(canvas.getBoundingClientRect().width * Math.min(window.devicePixelRatio || 1, 1.25)));
      canvas.width = resolution; canvas.height = resolution;
      context.setTransform(resolution / 600, 0, 0, resolution / 600, 0, 0);
      render(elapsed);
    };
    const tick = (time: number) => {
      if (stopped) return;
      if (time - lastFrame >= 1000 / 24) {
        if (lastTime !== null) elapsed += Math.min((time - lastTime) / 1000, .1);
        elapsedRef.current = elapsed;
        lastTime = time; lastFrame = time;
        render(elapsed);
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      stopped = paused || preference.matches || document.hidden || canvas.getBoundingClientRect().width < 1;
      canvas.dataset.motion = stopped ? "paused" : "flowing";
      lastTime = null;
      render(elapsed);
      if (!stopped) frame = requestAnimationFrame(tick);
    };
    const observer = new ResizeObserver(() => { resize(); sync(); });
    observer.observe(canvas);
    preference.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    resize(); sync();
    return () => { stopped = true; cancelAnimationFrame(frame); observer.disconnect(); preference.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); };
  }, [paused,palette]);
  return <div className="flowing-core" aria-hidden="true"><div className="flowing-aura" /><canvas ref={ref} width={600} height={600} /><div className="flowing-wordmark"><strong>JARVIS</strong></div></div>;
}
