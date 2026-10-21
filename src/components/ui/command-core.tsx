/** Decorative vector interface; no telemetry, AI activity or monitoring implied. */
export function CommandCore({ compact = false }: { compact?: boolean }) {
  return <div className={`command-core ${compact ? "core-compact" : ""}`} aria-hidden="true">
    <div className="core-halo" />
    <svg viewBox="0 0 400 400" className="core-vector" fill="none">
      <defs>
        <radialGradient id={compact ? "core-fill-compact" : "core-fill"}>
          <stop offset="0" stopColor="#0b5066" stopOpacity=".5" />
          <stop offset="1" stopColor="#04111e" stopOpacity=".2" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="184" className="core-orbit-faint" />
      <circle cx="200" cy="200" r="174" className="core-orbit-faint" strokeDasharray="2 10" />
      <g className="core-outer-ring">
        {Array.from({ length: 72 }, (_, i) => {
          const angle = i * Math.PI / 36;
          const inner = i % 6 === 0 ? 159 : 166;
          return <line key={i} x1={(200 + Math.sin(angle) * inner).toFixed(3)} y1={(200 - Math.cos(angle) * inner).toFixed(3)} x2={(200 + Math.sin(angle) * 171).toFixed(3)} y2={(200 - Math.cos(angle) * 171).toFixed(3)} className={i % 6 === 0 ? "core-tick-major" : "core-tick"} />;
        })}
        <circle cx="200" cy="200" r="151" className="core-ring-bright" strokeDasharray="172 36 50 64 190 68 92 277" transform="rotate(-80 200 200)" />
        <circle cx="200" cy="200" r="143" className="core-ring-muted" />
      </g>
      <circle cx="200" cy="200" r="132" className="core-ring-dashed" strokeDasharray="13 9" />
      <circle cx="200" cy="200" r="119" fill={`url(#${compact ? "core-fill-compact" : "core-fill"})`} className="core-ring-muted" />
      <g className="core-globe">
        <circle cx="200" cy="200" r="106" />
        <ellipse cx="200" cy="200" rx="106" ry="36" />
        <ellipse cx="200" cy="200" rx="106" ry="75" />
        <ellipse cx="200" cy="200" rx="37" ry="106" />
        <ellipse cx="200" cy="200" rx="76" ry="106" />
        <path d="M94 200h212M200 94v212" />
      </g>
      <path d="M14 200h40m292 0h40M200 14v40m0 292v40" className="core-crosshair" />
      <g className="core-orbit-points"><circle cx="200" cy="49" r="3" /><circle cx="351" cy="200" r="3" /><circle cx="200" cy="351" r="3" /><circle cx="49" cy="200" r="3" /></g>
      <ellipse cx="200" cy="200" rx="192" ry="67" transform="rotate(-26 200 200)" className="core-orbit-faint" />
    </svg>
    <div className="core-wordmark"><span className="core-overline">PERSONAL OPERATING SYSTEM</span><strong>PLUTO</strong><span className="core-underline">PRIVATE BY DESIGN</span></div>
    <div className="core-coordinate coordinate-top">INTERFACE / 01</div><div className="core-coordinate coordinate-bottom">FOUNDATION</div>
  </div>;
}
