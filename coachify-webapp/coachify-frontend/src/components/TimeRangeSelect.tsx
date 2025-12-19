import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type TimeRange = "7d" | "30d" | "90d"

interface TimeRangeSelectProps {
  value: TimeRange
  onValueChange: (value: TimeRange) => void
  className?: string
}

export function TimeRangeSelect({ value, onValueChange, className }: TimeRangeSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as TimeRange)}>
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
        <SelectItem value="30d" className="rounded-lg">
          Utolsó 30 nap
        </SelectItem>
        <SelectItem value="90d" className="rounded-lg">
          Utolsó 90 nap
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

