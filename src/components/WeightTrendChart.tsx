interface WeightPoint {
  date: string;
  weightLbs: number;
}

interface WeightTrendChartProps {
  history: WeightPoint[];
  startDate: string;
  targetDate: string;
  startWeightLbs: number;
  targetWeightLbs: number;
}

const WIDTH = 320;
const HEIGHT = 120;
const PADDING = 8;

function dayIndex(date: string, startDate: string) {
  const ms = new Date(`${date}T00:00:00`).getTime() - new Date(`${startDate}T00:00:00`).getTime();
  return ms / (1000 * 60 * 60 * 24);
}

export function WeightTrendChart({
  history,
  startDate,
  targetDate,
  startWeightLbs,
  targetWeightLbs,
}: WeightTrendChartProps) {
  const totalDays = Math.max(1, dayIndex(targetDate, startDate));
  const weights = history.map((h) => h.weightLbs).concat([startWeightLbs, targetWeightLbs]);
  const minW = Math.min(...weights) - 3;
  const maxW = Math.max(...weights) + 3;

  const x = (date: string) => PADDING + (dayIndex(date, startDate) / totalDays) * (WIDTH - PADDING * 2);
  const y = (w: number) => HEIGHT - PADDING - ((w - minW) / (maxW - minW)) * (HEIGHT - PADDING * 2);

  const targetPath = `M ${x(startDate)} ${y(startWeightLbs)} L ${x(targetDate)} ${y(targetWeightLbs)}`;

  const actualPoints = history.map((h) => `${x(h.date)},${y(h.weightLbs)}`).join(" ");
  const actualLine = history.length > 0 ? `M ${actualPoints.split(" ").join(" L ")}` : "";
  const actualArea =
    history.length > 0
      ? `M ${x(history[0].date)},${HEIGHT - PADDING} L ${actualPoints.split(" ").join(" L ")} L ${x(
          history[history.length - 1].date,
        )},${HEIGHT - PADDING} Z`
      : "";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
        <span>Weight Tracking</span>
        <span>{Math.round(totalDays)} days</span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
        {actualArea && <path d={actualArea} fill="var(--color-calorie)" fillOpacity={0.15} />}
        <path d={targetPath} stroke="#71717a" strokeWidth={1.5} strokeDasharray="4 3" fill="none" />
        {actualLine && (
          <path d={actualLine} stroke="var(--color-calorie)" strokeWidth={2} fill="none" />
        )}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
        <span>{startDate}</span>
        <span>{targetDate}</span>
      </div>
    </div>
  );
}
