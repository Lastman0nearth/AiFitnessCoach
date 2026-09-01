import { AlertTriangle } from "lucide-react";

interface AlertBannerProps {
  title: string;
  message: string;
  variant?: "alert" | "warning";
}

export function AlertBanner({ title, message, variant = "alert" }: AlertBannerProps) {
  const colorClass = variant === "warning" ? "border-warning/50 bg-warning/10" : "border-alert/50 bg-alert/10";
  const textClass = variant === "warning" ? "text-warning" : "text-alert";

  return (
    <div className={`flex gap-2 rounded-lg border px-3 py-2 ${colorClass}`}>
      <AlertTriangle size={16} className={`mt-0.5 shrink-0 ${textClass}`} />
      <div className="text-xs leading-snug text-zinc-200">
        <span className={`font-bold ${textClass}`}>{title}: </span>
        {message}
      </div>
    </div>
  );
}
