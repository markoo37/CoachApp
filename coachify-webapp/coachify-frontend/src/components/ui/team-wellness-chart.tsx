import { Bar, CartesianGrid, ComposedChart, Label, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

interface AthleteWellnessData {
  athleteId: number;
  firstName?: string;
  lastName?: string;
  averageWellnessIndex: number | null;
  samples: number;
}

interface TeamWellnessChartProps {
  data: AthleteWellnessData[];
}

export function TeamWellnessChart({ data }: TeamWellnessChartProps) {
  console.log("TeamWellnessChart received data:", data);
  console.log("Data length:", data.length);
  
  // Filter out athletes with no data and prepare chart data
  const chartData = data
    .filter((item) => {
      const hasData = item.averageWellnessIndex !== null && item.averageWellnessIndex !== undefined;
      if (!hasData) {
        console.log("Filtered out athlete:", item.athleteId, "averageWellnessIndex:", item.averageWellnessIndex);
      }
      return hasData;
    })
    .map((item) => ({
      athleteId: item.athleteId,
      fullName: `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || 'Névtelen',
      wellnessIndex: item.averageWellnessIndex!,
      samples: item.samples,
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'hu')); // Sort alphabetically by name

  console.log("Chart data after filtering:", chartData);
  console.log("Chart data length:", chartData.length);

  if (chartData.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>Nincs elérhető wellness adat</p>
          <p className="text-xs mt-2">Kapott adatok száma: {data.length}</p>
          {data.length > 0 && (
            <p className="text-xs mt-1">
              Adatok: {JSON.stringify(data.map(d => ({ id: d.athleteId, index: d.averageWellnessIndex, samples: d.samples })))}
            </p>
          )}
        </div>
      </div>
    );
  }

  const chartConfig = {
    wellnessIndex: {
      label: "Wellness Index",
      color: "rgb(var(--primary))",
    },
  } satisfies ChartConfig;

  return (
    <div className="flex h-96 flex-col gap-2">
      <ChartContainer config={chartConfig} className="h-full">
        <ComposedChart
          data={chartData}
          margin={{
            left: 4,
            right: 0,
            top: 12,
            bottom: 60, // Increased bottom margin for rotated labels
          }}
        >
          <CartesianGrid vertical={false} stroke="rgb(var(--foreground))" strokeOpacity={0.1} />

          <XAxis
            dataKey="fullName"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            stroke="rgb(var(--foreground))"
            strokeOpacity={0.5}
          >
          </XAxis>

          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => Number(value).toLocaleString()}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            stroke="rgb(var(--foreground))"
            strokeOpacity={0.5}
          >
            <Label
              value="Wellness Index"
              angle={-90}
              position="insideLeft"
              style={{ fill: "currentColor", fontSize: "12px", fontWeight: 500, textAnchor: "middle" }}
            />
          </YAxis>

          <Tooltip
            content={<ChartTooltipContent />}
            formatter={(value: number, _name: string, props: any) => {
              return [
                `${Number(value).toFixed(1)} (${props.payload.samples} mérés)`,
              ];
            }}
            labelFormatter={(value) => value}
            cursor={{
              fill: "rgba(0, 0, 0, 0.05)",
            }}
          />

          <Bar
            isAnimationActive={false}
            name="wellnessIndex"
            dataKey="wellnessIndex"
            fill="rgb(var(--primary))"
            maxBarSize={12}
            radius={[4, 4, 0, 0]}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}

