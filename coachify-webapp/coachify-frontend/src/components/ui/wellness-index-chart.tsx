import { useMemo, useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Loader2 } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TimeRangeSelect, TimeRange } from "@/components/TimeRangeSelect";
import type { WellnessIndex } from "@/types/wellnessIndex";

interface WellnessIndexChartProps {
  data: WellnessIndex[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

const areaChartConfig = {
  index: {
    label: "Érték: ",
    theme: {
      light: "rgb(var(--primary))",
      dark: "rgb(var(--primary))",
    },
  },
} satisfies ChartConfig;

export function WellnessIndexChart({
  data,
  timeRange,
  onTimeRangeChange,
  loading = false,
  emptyMessage = "Nincs elérhető wellness index adat a kiválasztott időszakban.",
  className = "",
}: WellnessIndexChartProps) {
  // Generate unique ID for gradient to avoid conflicts when component is used multiple times
  const gradientId = useId();
  
  // Filter wellness index data based on time range
  // If there's less data than the selected range, show all available data
  const filteredData = useMemo(() => {
    if (!data.length) return [];
    
    // First, sort all data by date
    const sortedData = data
      .map(item => ({
        date: item.date,
        index: item.index,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Try to filter by time range
    const today = new Date();
    const daysToSubtract = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    
    const filtered = sortedData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });
    
    // If filtered data is empty or has less than 2 items, return all available data
    if (filtered.length === 0 || filtered.length < 2) {
      return sortedData;
    }
    
    return filtered;
  }, [data, timeRange]);

  return (
    <div className={className}>
      <div className="flex justify-end mb-4">
        <TimeRangeSelect value={timeRange} onValueChange={onTimeRangeChange} />
      </div>
      {filteredData.length === 0 && !loading ? (
        <p className="text-muted-foreground text-center py-8">
          {emptyMessage}
        </p>
      ) : (
        <div className="relative">
          <div className={`transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            <ChartContainer
              config={areaChartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} /> {/* Red at bottom (low values) */}
                    <stop offset="50%" stopColor="#eab308" stopOpacity={0.1} />  {/* Yellow in middle */}
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.15} /> {/* Green at top (high values) */}
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgb(var(--foreground))" strokeOpacity={0.1} />
                <YAxis 
                  domain={[0, 100]} 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  stroke="rgb(var(--foreground))"
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("hu-HU", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  stroke="rgb(var(--foreground))"
                  strokeOpacity={0.5}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("hu-HU", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        });
                      }}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey="index"
                  type="natural"
                  fill={`url(#${gradientId})`}
                  stroke="rgb(var(--primary))"
                  strokeWidth={2}
                  dot={{
                    fill: "rgb(var(--foreground))",
                    fillOpacity: 0.6,
                    stroke: "rgb(var(--background))",
                    strokeWidth: 1.5,
                    r: 3,
                  }}
                  activeDot={{
                    fill: "rgb(var(--foreground))",
                    fillOpacity: 0.9,
                    stroke: "rgb(var(--background))",
                    strokeWidth: 2,
                    r: 4,
                  }}
                />
              </AreaChart>
            </ChartContainer>
          </div>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

