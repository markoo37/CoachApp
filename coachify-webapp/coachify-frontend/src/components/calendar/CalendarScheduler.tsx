import { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import type {
  DatesSetArg,
  EventClickArg,
  EventInput,
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { format, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type CalendarSchedulerView = "day" | "week" | "month";

export type CalendarSchedulerAttendee = {
  name: string;
  avatarUrl?: string;
};

export type CalendarSchedulerEvent = {
  id: string;
  title: string;
  start: Date | string;
  end?: Date | string;
  allDay?: boolean;
  description?: string;
  location?: string;
  attendees?: CalendarSchedulerAttendee[];
  /**
   * If provided, this will be used as the event background/border color.
   * You can pass hex like "#7c3aed" or "rgb(...)".
   */
  color?: string;
  textColor?: string;
};

export type CalendarSchedulerProps = {
  className?: string;
  events: CalendarSchedulerEvent[];
  initialDate?: Date;
  initialView?: CalendarSchedulerView;
  onAddEvent?: () => void;
  onEventClick?: (event: CalendarSchedulerEvent) => void;
  onRangeChange?: (range: {
    /** Inclusive start date of the visible range. */
    from: Date;
    /** Inclusive end date of the visible range. */
    to: Date;
    view: CalendarSchedulerView;
  }) => void;
};

function toFullCalendarView(view: CalendarSchedulerView) {
  if (view === "day") return "timeGridDay";
  if (view === "week") return "timeGridWeek";
  return "dayGridMonth";
}

function viewLabel(view: CalendarSchedulerView) {
  if (view === "day") return "Day view";
  if (view === "week") return "Week view";
  return "Month view";
}

export default function CalendarScheduler({
  className,
  events,
  initialDate = new Date(),
  initialView = "week",
  onAddEvent,
  onEventClick,
  onRangeChange,
}: CalendarSchedulerProps) {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [activeView, setActiveView] = useState<CalendarSchedulerView>(initialView);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [title, setTitle] = useState<string>(() => format(initialDate, "MMMM yyyy"));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () => (selectedEventId ? events.find((e) => e.id === selectedEventId) : undefined),
    [events, selectedEventId]
  );

  const fcEvents: EventInput[] = useMemo(() => {
    return events.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      allDay: e.allDay,
      backgroundColor: e.color,
      borderColor: e.color,
      textColor: e.textColor,
      extendedProps: {
        description: e.description,
        location: e.location,
        attendees: e.attendees,
      },
    }));
  }, [events]);

  const api = () => calendarRef.current?.getApi();

  const goToday = () => {
    api()?.today();
    const d = api()?.getDate() ?? new Date();
    setSelectedDate(d);
  };

  const goPrev = () => {
    api()?.prev();
    const d = api()?.getDate() ?? selectedDate;
    setSelectedDate(d);
  };

  const goNext = () => {
    api()?.next();
    const d = api()?.getDate() ?? selectedDate;
    setSelectedDate(d);
  };

  const onDatesSet = (arg: DatesSetArg) => {
    setTitle(arg.view.title);

    // FullCalendar gives an exclusive `end` (range is [start, end))
    // Backend expects inclusive DateOnly range, so we convert `endExclusive` -> `toInclusive`.
    const endExclusive = arg.end;
    const toInclusive = subDays(endExclusive, 1);

    onRangeChange?.({
      from: arg.start,
      to: toInclusive,
      view: activeView,
    });
  };

  const handleEventClick = (arg: EventClickArg) => {
    const id = String(arg.event.id);
    setSelectedEventId(id);
    const ev = events.find((e) => e.id === id);
    if (ev) onEventClick?.(ev);
  };

  const setView = (view: CalendarSchedulerView) => {
    setActiveView(view);
    api()?.changeView(toFullCalendarView(view));
  };

  const handleMiniMonthSelect = (d?: Date) => {
    if (!d) return;
    setSelectedDate(d);
    api()?.gotoDate(d);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-semibold text-foreground">{title}</div>
                <div className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  {activeView === "week" ? "Week" : activeView === "day" ? "Day" : "Month"}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {activeView === "day"
                  ? format(selectedDate, "EEEE")
                  : format(selectedDate, "PP")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-border bg-background">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-r-none"
                onClick={goPrev}
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="rounded-none px-3 text-sm"
                onClick={goToday}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-l-none"
                onClick={goNext}
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Select value={activeView} onValueChange={(v) => setView(v as CalendarSchedulerView)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">{viewLabel("day")}</SelectItem>
                <SelectItem value="week">{viewLabel("week")}</SelectItem>
                <SelectItem value="month">{viewLabel("month")}</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={onAddEvent} className="gap-2">
              <Plus className="h-4 w-4" />
              Add event
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <div className="coachify-calendar overflow-hidden rounded-2xl border border-border bg-background">
            <div className="h-[740px] p-2">
              <FullCalendar
                ref={(r) => {
                  calendarRef.current = r;
                }}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialDate={initialDate}
                initialView={toFullCalendarView(initialView)}
                headerToolbar={false}
                weekends={true}
                nowIndicator={true}
                editable={false}
                selectable={true}
                dayMaxEvents={true}
                height="100%"
                expandRows={true}
                slotMinTime="00:00:00"
                slotMaxTime="24:00:00"
                allDaySlot={false}
                events={fcEvents}
                datesSet={onDatesSet}
                eventClick={handleEventClick}
                eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                viewDidMount={() => {
                  // keep local state aligned on first mount
                  const d = api()?.getDate() ?? initialDate;
                  setSelectedDate(d);
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-foreground">
                {format(selectedDate, "MMMM yyyy")}
              </div>
            </div>

            <div className="mt-3 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleMiniMonthSelect}
              />
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">
                  {selectedEvent ? selectedEvent.title : "No event selected"}
                </div>
              </div>

              {selectedEvent ? (
                <Card className="mt-3">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(selectedEvent.start), "EEEE, MMM d, yyyy")}
                        {selectedEvent.end
                          ? ` • ${format(new Date(selectedEvent.start), "HH:mm")} – ${format(
                              new Date(selectedEvent.end),
                              "HH:mm"
                            )}`
                          : ` • ${format(new Date(selectedEvent.start), "HH:mm")}`}
                      </div>

                      {selectedEvent.location ? (
                        <div className="text-sm text-foreground">{selectedEvent.location}</div>
                      ) : null}

                      {selectedEvent.description ? (
                        <div className="text-sm text-muted-foreground">
                          {selectedEvent.description}
                        </div>
                      ) : null}

                      {selectedEvent.attendees?.length ? (
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {selectedEvent.attendees.slice(0, 6).map((a) => (
                              <Avatar key={a.name} className="h-8 w-8 border border-border">
                                <AvatarImage src={a.avatarUrl} alt={a.name} />
                                <AvatarFallback className="text-xs">
                                  {a.name
                                    .split(" ")
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .map((p) => p[0]?.toUpperCase())
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {selectedEvent.attendees.length} guests
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="mt-2 text-sm text-muted-foreground">
                  Click an event in the calendar to see details here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


