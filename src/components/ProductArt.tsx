import type { Motif } from "@/data/catalog";

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/** Illustrated vector product imagery (no photo licensing needed). Replace with photography when available. */
export function ProductArt({ motif, bg, accent, seed, className }: { motif: Motif; bg: string; accent: string; seed: string; className?: string }) {
  const r = rng(seed);
  const dark = shade(accent, -0.18), light = shade(accent, 0.16);
  const items: React.ReactNode[] = [];
  const W = 400, H = 300;
  if (motif === "tuber") {
    for (let i = 0; i < 9; i++) {
      const x = 90 + r() * 220, y = 130 + r() * 120, rx = 38 + r() * 18, ry = 26 + r() * 12, rot = r() * 60 - 30;
      items.push(<g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}><ellipse rx={rx} ry={ry} fill={accent} /><ellipse rx={rx} ry={ry} fill="none" stroke={dark} strokeOpacity=".25" strokeWidth="2" /><ellipse cx={-rx * 0.3} cy={-ry * 0.35} rx={rx * 0.4} ry={ry * 0.22} fill={light} opacity=".55" />{[0, 1, 2].map((k) => <circle key={k} cx={(r() - 0.5) * rx} cy={(r() - 0.5) * ry} r="2" fill={dark} opacity=".5" />)}</g>);
    }
  } else if (motif === "round") {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const x = 80 + r() * 240, y = 120 + r() * 110, rad = 34 + r() * 14;
      items.push(<g key={i} transform={`translate(${x} ${y})`}><circle r={rad} fill={accent} /><circle r={rad} fill="none" stroke={dark} strokeOpacity=".2" strokeWidth="2" /><ellipse cx={-rad * 0.35} cy={-rad * 0.4} rx={rad * 0.28} ry={rad * 0.16} fill="#fff" opacity=".4" transform="rotate(-30)" /><path d={`M-6 ${-rad + 3} q6 -12 12 0`} stroke="#3d6b36" strokeWidth="4" fill="none" strokeLinecap="round" /></g>);
    }
  } else if (motif === "elongated") {
    for (let i = 0; i < 6; i++) {
      const x = 90 + r() * 220, y = 120 + r() * 120, l = 90 + r() * 30, rot = -40 + r() * 80;
      items.push(<g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}><path d={`M${-l / 2} 0 C${-l / 4} -18 ${l / 4} -20 ${l / 2} -4 C${l / 4} 14 ${-l / 4} 18 ${-l / 2} 0Z`} fill={accent} /><path d={`M${-l / 2} 0 C${-l / 2 - 10} -8 ${-l / 2 - 14} -2 ${-l / 2 - 16} 6`} stroke="#3d6b36" strokeWidth="5" fill="none" strokeLinecap="round" /><path d={`M${-l / 3} -6 C0 -12 ${l / 4} -11 ${l / 3} -5`} stroke="#fff" strokeOpacity=".35" strokeWidth="3" fill="none" strokeLinecap="round" /></g>);
    }
  } else if (motif === "leaf") {
    for (let i = 0; i < 7; i++) {
      const rot = -70 + i * 24;
      items.push(<g key={i} transform={`translate(200 250) rotate(${rot})`}><path d="M0 0 C-34 -50 -30 -120 0 -150 C30 -120 34 -50 0 0Z" fill={i % 2 ? accent : light} /><path d="M0 -6 V-140" stroke={dark} strokeOpacity=".3" strokeWidth="2" /></g>);
    }
    items.push(<circle key="c" cx="200" cy="180" r="48" fill="#fbf8f0" stroke="#e5dfcc" strokeWidth="2" />);
    for (let i = 0; i < 14; i++) items.push(<circle key={`b${i}`} cx={170 + r() * 60} cy={150 + r() * 55} r={9 + r() * 6} fill="#fffdf6" stroke="#e8e1cb" strokeWidth="1.5" />);
  } else if (motif === "grain" || motif === "powder") {
    items.push(<path key="m" d="M60 255 C90 150 150 110 200 108 C250 110 310 150 340 255Z" fill={motif === "powder" ? accent : light} />);
    const n = motif === "powder" ? 60 : 140;
    for (let i = 0; i < n; i++) {
      const t = r(), x = 70 + r() * 260, top = 255 - Math.max(0, 150 * Math.sin(((x - 60) / 280) * Math.PI)), y = top + 4 + r() * (255 - top - 6);
      items.push(motif === "powder" ? <circle key={i} cx={x} cy={y} r={1.5 + r() * 2} fill={t > 0.5 ? dark : light} opacity=".6" /> : <ellipse key={i} cx={x} cy={y} rx="5" ry="2.4" fill={t > 0.5 ? dark : "#fff"} opacity=".55" transform={`rotate(${r() * 180} ${x} ${y})`} />);
    }
    items.push(<ellipse key="b" cx="200" cy="262" rx="150" ry="14" fill="#000" opacity=".08" />);
    if (motif === "powder") items.push(<g key="bowl"><path d="M50 235 H350 C350 285 300 292 200 292 C100 292 50 285 50 235Z" fill="#fbf8f0" stroke="#e5dfcc" strokeWidth="2" /></g>);
  } else if (motif === "fish") {
    for (let i = 0; i < 2; i++) {
      items.push(<g key={i} transform={`translate(${i ? 220 : 170} ${i ? 200 : 130}) rotate(${i ? -8 : 6})`}><path d="M-110 0 C-60 -52 40 -52 90 -6 L132 -38 L126 0 L132 38 L90 6 C40 52 -60 52 -110 0Z" fill={accent} /><path d="M-100 4 C-50 30 30 30 85 4 C30 52 -60 50 -100 4Z" fill="#fff" opacity=".35" /><circle cx="-76" cy="-8" r="6" fill="#fff" /><circle cx="-75" cy="-8" r="2.8" fill="#142B45" /><path d="M-52 -26 C-40 -4 -40 8 -52 28" stroke="#fff" strokeOpacity=".4" strokeWidth="3" fill="none" />{[...Array(8)].map((_, k) => <path key={k} d={`M${-30 + k * 12} -22 q8 20 0 40`} stroke="#fff" strokeOpacity=".18" strokeWidth="2" fill="none" />)}</g>);
    }
  } else if (motif === "egg") {
    for (let i = 0; i < 9; i++) {
      const x = 90 + (i % 5) * 52 + (i > 4 ? 26 : 0), y = i > 4 ? 190 : 130;
      items.push(<g key={i} transform={`translate(${x} ${y + r() * 6})`}><path d="M0 -38 C24 -38 34 -4 30 14 C26 34 12 42 0 42 C-12 42 -26 34 -30 14 C-34 -4 -24 -38 0 -38Z" fill={i % 3 === 0 ? "#e6c59a" : "#fbf4e8"} stroke={dark} strokeOpacity=".25" strokeWidth="2" /><ellipse cx="-9" cy="-14" rx="6" ry="12" fill="#fff" opacity=".5" /></g>);
    }
    items.push(<path key="tray" d="M50 245 H350 L335 280 H65Z" fill="#c9a77a" opacity=".6" />);
  } else if (motif === "jar") {
    items.push(<g key="jar"><rect x="140" y="70" width="120" height="30" rx="4" fill={dark} /><path d="M148 100 H252 C275 125 280 150 280 175 V250 C280 268 268 280 250 280 H150 C132 280 120 268 120 250 V175 C120 150 125 125 148 100Z" fill={accent} opacity=".95" /><path d="M120 185 H280 V250 C280 268 268 280 250 280 H150 C132 280 120 268 120 250Z" fill={dark} opacity=".25" /><rect x="140" y="150" width="120" height="70" rx="3" fill="#fbf8f0" /><rect x="156" y="168" width="88" height="8" rx="2" fill="#142B45" opacity=".8" /><rect x="170" y="186" width="60" height="5" rx="2" fill="#167C78" opacity=".8" /><path d="M136 120 C132 150 132 200 134 240" stroke="#fff" strokeOpacity=".5" strokeWidth="6" strokeLinecap="round" fill="none" /></g>);
  }
  if (motif === "pot") {
    items.push(<g key="pot"><ellipse cx="200" cy="268" rx="104" ry="12" fill="#142B45" opacity=".09" /><path d="M118 130 H282 C296 175 290 235 262 262 C240 280 160 280 138 262 C110 235 104 175 118 130Z" fill={accent} /><path d="M118 130 H282 C288 150 290 170 289 186 H111 C110 170 112 150 118 130Z" fill={dark} opacity=".25" /><ellipse cx="200" cy="130" rx="82" ry="17" fill="#fbf4e2" /><ellipse cx="200" cy="130" rx="82" ry="17" fill="none" stroke={dark} strokeOpacity=".3" strokeWidth="2" /><ellipse cx="180" cy="127" rx="34" ry="6" fill="#fff" opacity=".8" /><path d="M126 200 q74 20 148 0" stroke="#fff" strokeOpacity=".35" strokeWidth="3" fill="none" /><path d="M130 224 q70 18 140 0" stroke="#fff" strokeOpacity=".25" strokeWidth="3" fill="none" /></g>);
  } else if (motif === "sweet") {
    items.push(<g key="plate"><ellipse cx="200" cy="228" rx="150" ry="40" fill="#fbf8f0" stroke="#e5dfcc" strokeWidth="2" /><ellipse cx="200" cy="224" rx="124" ry="30" fill="#f1ead8" opacity=".7" /></g>);
    for (let i = 0; i < 8; i++) {
      const ring = i < 5 ? 0 : 1, k = ring ? i - 5 : i, x = ring ? 140 + k * 60 : 98 + k * 52, y = ring ? 168 : 214 + (k % 2) * 6, rr = 24 + r() * 5;
      items.push(<g key={i} transform={`translate(${x} ${y})`}><ellipse rx={rr} ry={rr * 0.82} fill={accent} /><ellipse rx={rr} ry={rr * 0.82} fill="none" stroke={dark} strokeOpacity=".28" strokeWidth="2" /><ellipse cx={-rr * 0.3} cy={-rr * 0.3} rx={rr * 0.34} ry={rr * 0.18} fill="#fff" opacity=".5" />{[0, 1, 2, 3].map((q) => <circle key={q} cx={(r() - 0.5) * rr} cy={(r() - 0.5) * rr * 0.7} r="1.8" fill={dark} opacity=".45" />)}</g>);
    }
  } else if (motif === "cloth") {
    for (let i = 0; i < 4; i++) {
      const y = 215 - i * 34, dx = (i % 2 ? 12 : -8);
      items.push(<g key={i} transform={`translate(${dx} 0)`}><rect x="78" y={y} width="244" height="34" rx="5" fill={i % 2 ? shade(accent, 0.12) : accent} /><rect x="78" y={y} width="244" height="7" fill={dark} opacity=".35" /><rect x="78" y={y + 27} width="244" height="7" fill={dark} opacity=".35" />{[...Array(10)].map((_, k) => <path key={k} d={`M${96 + k * 23} ${y + 17} l5 -5 l5 5 l-5 5z`} fill="#fff" opacity=".6" />)}</g>);
    }
    items.push(<ellipse key="sh" cx="200" cy="254" rx="140" ry="9" fill="#142B45" opacity=".1" />);
  } else if (motif === "mat") {
    items.push(<g key="mat"><rect x="70" y="95" width="260" height="150" rx="6" fill={accent} /><g stroke={dark} strokeOpacity=".28" strokeWidth="2">{[...Array(14)].map((_, k) => <line key={`h${k}`} x1="70" y1={105 + k * 10} x2="330" y2={105 + k * 10} />)}{[...Array(14)].map((_, k) => <line key={`v${k}`} x1={85 + k * 19} y1="95" x2={85 + k * 19} y2="245" strokeOpacity=".16" />)}</g><rect x="70" y="95" width="260" height="14" fill={dark} opacity=".45" /><rect x="70" y="231" width="260" height="14" fill={dark} opacity=".45" /><rect x="170" y="150" width="60" height="42" rx="3" fill="#fff" opacity=".28" /></g>);
  } else if (motif === "dried") {
    for (let i = 0; i < 7; i++) {
      const x = 120 + i * 26, rot = (i - 3) * 6, len = 150 + r() * 24;
      items.push(<g key={i} transform={`translate(${x} 245) rotate(${rot})`}><path d={`M0 0 C-14 ${-len * 0.4} -12 ${-len * 0.8} 0 ${-len} C12 ${-len * 0.8} 14 ${-len * 0.4} 0 0Z`} fill={i % 2 ? accent : shade(accent, 0.08)} /><path d={`M0 ${-len * 0.1} V${-len * 0.9}`} stroke="#fff" strokeOpacity=".3" strokeWidth="2" /><circle cx="0" cy={-len + 12} r="2.4" fill="#fff" opacity=".9" /></g>);
    }
    items.push(<rect key="tie" x="116" y="168" width="168" height="10" rx="5" fill="#8a5a2b" />);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-hidden>
      <rect width={W} height={H} fill={bg} />
      <circle cx="330" cy="50" r="110" fill="#fff" opacity=".28" />
      <ellipse cx="200" cy="262" rx="170" ry="16" fill="#142B45" opacity=".07" />
      {items}
    </svg>
  );
}
