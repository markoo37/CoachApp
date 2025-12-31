import TopHeader from "@/components/TopHeader";
import CalendarScheduler, {
  type CalendarSchedulerEvent,
} from "@/components/calendar/CalendarScheduler";
import { useMemo, useState } from "react";
import { useTrainingPlansInRangeQuery } from "@/queries/trainingPlans.queries";

export default function CalendarPage() {
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({});

  const { data: plans = [] } = useTrainingPlansInRangeQuery(range.from, range.to);

  const events: CalendarSchedulerEvent[] = useMemo(() => {
    const parseLocalDateTime = (dateOnly: string, timeOnly?: string) => {
      // dateOnly: YYYY-MM-DD
      const [y, m, d] = dateOnly.split("-").map(Number);
      const [hh = 0, mm = 0, ss = 0] = (timeOnly ?? "09:00:00")
        .split(":")
        .map((p) => Number(p));
      return new Date(y, m - 1, d, hh, mm, ss);
    };

    return plans.map((p) => {
      const start = parseLocalDateTime(p.Date, p.StartTime);
      const end = p.EndTime
        ? parseLocalDateTime(p.Date, p.EndTime)
        : new Date(start.getTime() + 60 * 60 * 1000);

      const target = p.AthleteName ?? p.TeamName;
      const title = target ? `${p.Name} • ${target}` : p.Name;

      return {
        id: String(p.Id),
        title,
        start,
        end,
        description: p.Description,
        color: "#2563eb",
        textColor: "#fff",
      };
    });
  }, [plans]);

  return (
    <div className="min-h-screen bg-background lg:pl-64">
      <TopHeader title="Naptár" subtitle="Időbeosztás és események" />

      <div className="px-6 py-8 lg:px-8">
        <CalendarScheduler
          events={events}
          initialDate={new Date(2025, 11, 29)}
          initialView="day"
          onRangeChange={({ from, to }) => setRange({ from, to })}
          onAddEvent={() => {}}
        />
      </div>
    </div>
  );
}