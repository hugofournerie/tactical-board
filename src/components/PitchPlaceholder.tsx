// Terrain provisoire (SVG statique). Remplacé par le canvas Konva en Phase 2.
// Repère logique en mètres : 105 x 68.
export default function PitchPlaceholder() {
  const line = {
    fill: "none",
    stroke: "rgba(255,255,255,0.75)",
    strokeWidth: 1.5,
    vectorEffect: "non-scaling-stroke" as const,
  };

  return (
    <svg
      viewBox="0 0 105 68"
      role="img"
      aria-label="Terrain de football"
      className="block h-full w-full rounded-xl bg-pitch"
    >
      <rect x="0.5" y="0.5" width="104" height="67" {...line} />
      <line x1="52.5" y1="0.5" x2="52.5" y2="67.5" {...line} />
      <circle cx="52.5" cy="34" r="9.15" {...line} />
      <rect x="0.5" y="13.84" width="16.5" height="40.32" {...line} />
      <rect x="88" y="13.84" width="16.5" height="40.32" {...line} />
      <rect x="0.5" y="24.84" width="5.5" height="18.32" {...line} />
      <rect x="99" y="24.84" width="5.5" height="18.32" {...line} />
    </svg>
  );
}
