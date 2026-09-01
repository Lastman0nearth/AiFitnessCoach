interface LiftStatus {
  lift: string;
  topWeightLbs: number | null;
  warning: boolean;
}

export function StrengthMonitor({ lifts }: { lifts: LiftStatus[] }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Autoregulatory Strength Monitor
      </div>
      <div className="grid grid-cols-2 gap-2">
        {lifts.map((l) => (
          <div key={l.lift} className="rounded-lg bg-charcoal-light px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">{l.lift}</div>
            <div className={`text-sm font-semibold ${l.warning ? "text-warning" : "text-protein"}`}>
              {l.topWeightLbs !== null ? `${l.topWeightLbs} lbs` : "—"}
              {l.warning && " (WARNING)"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
