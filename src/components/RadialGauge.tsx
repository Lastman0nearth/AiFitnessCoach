interface RadialGaugeProps {
  percent: number;
  colorClass: string;
  trackClass?: string;
  label: string;
  sublabel: string;
  size?: number;
}

export function RadialGauge({
  percent,
  colorClass,
  trackClass = "text-zinc-800",
  label,
  sublabel,
  size = 96,
}: RadialGaugeProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={8}
            fill="none"
            className={trackClass}
            stroke="currentColor"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={8}
            fill="none"
            className={colorClass}
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-zinc-100">{Math.round(clamped)}%</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</div>
        <div className={`text-xs font-medium ${colorClass}`}>{sublabel}</div>
      </div>
    </div>
  );
}
