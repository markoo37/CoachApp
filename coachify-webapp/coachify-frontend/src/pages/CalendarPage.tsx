import TopHeader from "@/components/TopHeader";
import CalendarScheduler, {
  type CalendarSchedulerView,
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

  const STORAGE_KEY = "coachify.calendar.state.v1";

  const readSavedCalendarState = (): { date: Date; view: CalendarSchedulerView } | null => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { date?: string; view?: CalendarSchedulerView };
      if (!parsed?.date || !parsed?.view) return null;
      const d = new Date(parsed.date);
      if (Number.isNaN(d.getTime())) return null;
      if (!["day", "week", "month"].includes(parsed.view)) return null;
      return { date: d, view: parsed.view };
    } catch {
      return null;
    }
  };

  const saved = readSavedCalendarState();
  const initialDate = saved?.date ?? new Date();
  const initialView: CalendarSchedulerView = saved?.view ?? "week";

  return (
    <div className="min-h-screen bg-background lg:pl-64">
      <TopHeader title="Naptár" subtitle="Időbeosztás és események" />

      <div className="px-6 py-8 lg:px-8">
        <CalendarScheduler
          events={events}
          initialDate={initialDate}
          initialView={initialView}
          onRangeChange={({ from, to, currentDate, view }) => {
            setRange({ from, to });
            try {
              sessionStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ date: currentDate.toISOString(), view })
              );
            } catch {
              // ignore storage errors (private mode/quota)
            }
          }}
          onAddEvent={() => {}}
        />
      </div>
    </div>
  );
}