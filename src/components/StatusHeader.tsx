interface StatusHeaderProps {
  dayNumber: number;
  totalDays: number;
  dayTypeLabel: string;
  caloriesRemaining: number;
  systemStatus: "OPTIMIZED" | "WARNING";
}

export function StatusHeader({
  dayNumber,
  totalDays,
  dayTypeLabel,
  caloriesRemaining,
  systemStatus,
}: StatusHeaderProps) {
  const statusColor = systemStatus === "OPTIMIZED" ? "text-calorie" : "text-warning";
  const remainingText =
    caloriesRemaining >= 0
      ? `You have ${caloriesRemaining.toLocaleString()} kcal remaining today.`
      : `You are ${Math.abs(caloriesRemaining).toLocaleString()} kcal over budget today.`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <span>
          System Status: <span className={statusColor}>{systemStatus}</span>
        </span>
        <span>
          Day {dayNumber}/{totalDays}
        </span>
      </div>
      <div className="text-xs text-zinc-500">Today's Target: {dayTypeLabel}</div>
      <h1 className="text-2xl font-extrabold leading-tight text-zinc-50 sm:text-3xl">
        {remainingText}
      </h1>
    </div>
  );
}
