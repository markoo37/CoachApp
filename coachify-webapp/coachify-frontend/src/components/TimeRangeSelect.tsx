import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type TimeRange = "7d" | "14d" | "30d" | "180d" | "365d";

const isTimeRange = (v: string): v is TimeRange =>
  v === "7d" ||
  v === "14d" ||
  v === "30d" ||
  v === "180d" ||
  v === "365d";

interface TimeRangeSelectProps {
  value: TimeRange
  onValueChange: (value: TimeRange) => void
  className?: string
}

export function TimeRangeSelect({ value, onValueChange, className }: TimeRangeSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => {
      if (isTimeRange(v)) {
        onValueChange(v);
      }
    }}>
      <SelectTrigger
        className={`w-[160px] rounded-lg sm:ml-auto focus:ring-0 focus:ring-offset-0 ${className ?? ""}`}
        aria-label="Select time range"
      >
        <SelectValue placeholder="Időszak" />
      </SelectTrigger>
      <SelectContent className="rounded-xl" position="popper">

        <SelectItem value="7d" className="rounded-lg">
        Utolsó 7 nap
        </SelectItem>

        <SelectItem value="14d" className="rounded-lg">
          Utolsó 14 nap
        </SelectItem>

        <SelectItem value="30d" className="rounded-lg">
          Utolsó 30 nap
        </SelectItem>

        <SelectItem value="180d" className="rounded-lg">
          Utolsó 180 nap
        </SelectItem>

        <SelectItem value="365d" className="rounded-lg">
          Utolsó 365 nap
        </SelectItem>

      </SelectContent>
    </Select>
  )
}

