import type { WeeklyVolumeRow } from "../types";

export function WeeklyVolumeMatrix({ rows }: { rows: WeeklyVolumeRow[] }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Weekly Volume Matrix
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead>
            <tr className="text-zinc-500">
              <th className="pb-1 pr-2 font-medium">Date</th>
              <th className="pb-1 pr-2 font-medium">Session</th>
              <th className="pb-1 pr-2 font-medium">Goal</th>
              <th className="pb-1 pr-2 font-medium">Actual</th>
              <th className="pb-1 font-medium">Pace</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.date} className="border-t border-zinc-800 text-zinc-300">
                <td className="py-1.5 pr-2">{row.date.slice(5)}</td>
                <td className="py-1.5 pr-2">{row.label}</td>
                <td className="py-1.5 pr-2">{row.goalKm ? `${row.goalKm}km` : "—"}</td>
                <td className="py-1.5 pr-2">{row.actualKm ? `${row.actualKm}km` : "—"}</td>
                <td className="py-1.5">{row.pace ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
