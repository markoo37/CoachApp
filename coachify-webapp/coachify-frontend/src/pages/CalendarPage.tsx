import TopHeader from "@/components/TopHeader";
import CalendarScheduler, {
  type CalendarSchedulerEvent,
} from "@/components/calendar/CalendarScheduler";

export default function CalendarPage() {
  // Sample data (replace with API-backed events later)
  const events: CalendarSchedulerEvent[] = [
    {
      id: "team-lunch",
      title: "Team lunch",
      start: new Date(2025, 11, 29, 13, 15),
      end: new Date(2025, 11, 29, 14, 15),
      description: "Quick lunch with the team.",
      color: "#7c1d3a",
      textColor: "#fff",
    },
    {
      id: "design-sync",
      title: "Design sync",
      start: new Date(2025, 11, 31, 15, 30),
      end: new Date(2025, 11, 31, 16, 30),
      color: "#1d4ed8",
      textColor: "#fff",
    },
    {
      id: "accountant",
      title: "Accountant",
      start: new Date(2026, 0, 2, 14, 45),
      end: new Date(2026, 0, 2, 15, 15),
      color: "#a16207",
      textColor: "#fff",
    },
    {
      id: "marketing-sync",
      title: "Marketing site sync",
      start: new Date(2026, 0, 2, 15, 30),
      end: new Date(2026, 0, 2, 16, 0),
      color: "#374151",
      textColor: "#fff",
    },
    {
      id: "product-demo",
      title: "Product demo",
      start: new Date(2025, 11, 19, 14, 30),
      end: new Date(2025, 11, 19, 15, 30),
      description: "Demo + Q&A.",
      attendees: [
        { name: "Sienna" },
        { name: "Olivia" },
        { name: "Riley" },
        { name: "Noah" },
        { name: "Mila" },
        { name: "Ethan" },
      ],
      color: "#2563eb",
      textColor: "#fff",
    },
  ];

  return (
    <div className="min-h-screen bg-background lg:pl-64">
      <TopHeader title="Naptár" subtitle="Időbeosztás és események" />

      <div className="px-6 py-8 lg:px-8">
        <CalendarScheduler
          events={events}
          initialDate={new Date(2025, 11, 29)}
          initialView="day"
          onAddEvent={() => {}}
        />
      </div>
    </div>
  );
}