import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import TopHeader from "../components/TopHeader";
import { getAthleteWellness, WellnessCheck } from "../api/wellness";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, TrendingUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TimeRangeSelect, TimeRange } from "@/components/TimeRangeSelect";
import { fetchWellnessIndex } from "../api/wellness";
import type { WellnessIndex } from "../types/wellnessIndex";

interface AthleteDetails {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  weight?: number;
  height?: number;
  hasUserAccount: boolean;
}

export default function AthleteDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const athleteId = Number(id);

  const [athlete, setAthlete] = useState<AthleteDetails | null>(null);
  const [wellness, setWellness] = useState<WellnessCheck[]>([]);
  const [wellnessIndex, setWellnessIndex] = useState<WellnessIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [wellnessLoading, setWellnessLoading] = useState(false);
  const [wellnessIndexLoading, setWellnessIndexLoading] = useState(false);
  const [wellnessSummaryTimeRange, setWellnessSummaryTimeRange] = useState<TimeRange>("7d");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  
  // Convert wellness summary timeRange to days
  const days = useMemo(() => {
    return wellnessSummaryTimeRange === "7d" ? 7 : wellnessSummaryTimeRange === "30d" ? 30 : 90;
  }, [wellnessSummaryTimeRange]);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<{
    wellnessSummary: boolean;
    wellnessIndex: boolean;
    detailedWellness: boolean;
  }>({
    wellnessSummary: false,
    wellnessIndex: false,
    detailedWellness: false,
  });

  // Refs for scroll-to functionality
  const wellnessSummaryRef = useRef<HTMLDivElement>(null);
  const wellnessIndexRef = useRef<HTMLDivElement>(null);
  const detailedWellnessRef = useRef<HTMLDivElement>(null);

  // Helper function to scroll to a ref with offset
  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>, yOffset: number = -200) => {
    if (ref.current) {
      const element = ref.current;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };


  // Load athlete data only once
  useEffect(() => {
    if (!athleteId) return;

    const loadAthlete = async () => {
      try {
        setLoading(true);
        setError(null);

        const athleteRes = await api.get(`/athletes/${athleteId}`);
        const a = athleteRes.data;

        setAthlete({
          id: a.id ?? a.Id,
          firstName: a.firstName ?? a.FirstName,
          lastName: a.lastName ?? a.LastName,
          email: a.email ?? a.Email,
          weight: a.weight ?? a.Weight,
          height: a.height ?? a.Height,
          hasUserAccount: a.hasUserAccount ?? a.HasUserAccount,
        });
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Nem sikerült betölteni a sportoló adatait.");
      } finally {
        setLoading(false);
      }
    };

    loadAthlete();
  }, [athleteId]);

  // Load wellness data separately when days changes
  useEffect(() => {
    if (!athleteId) return;

    const loadWellness = async () => {
      try {
        setWellnessLoading(true);
        const w = await getAthleteWellness(athleteId, days);
        setWellness(w);
      } catch (err: any) {
        console.error(err);
        // Don't set error state for wellness loading failures, just log
      } finally {
        setWellnessLoading(false);
      }
    };

    loadWellness();
  }, [athleteId, days]);

  // Load wellness index data when time range changes
  useEffect(() => {
    if (!athleteId) return;

    const loadWellnessIndex = async () => {
      try {
        setWellnessIndexLoading(true);
        const today = new Date();
        const daysToSubtract = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
        const fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - daysToSubtract);
        
        const from = fromDate.toISOString().split('T')[0];
        const to = today.toISOString().split('T')[0];
        
        const data = await fetchWellnessIndex(athleteId, from, to);
        setWellnessIndex(data);
      } catch (err: any) {
        console.error(err);
        // Don't set error state for wellness index loading failures, just log
      } finally {
        setWellnessIndexLoading(false);
      }
    };

    loadWellnessIndex();
  }, [athleteId, timeRange]);

  const fullName =
    (athlete?.firstName || athlete?.lastName)
      ? `${athlete?.firstName ?? ""} ${athlete?.lastName ?? ""}`.trim()
      : "Ismeretlen név";

  // Get color for wellness parameter badge
  const getWellnessBadgeColor = (paramName: string, value: number): string => {
    const normalizedValue = value / 10; // Normalize to 0-1
    
    // SleepQuality and Mood: higher is better (1 = red, 10 = green)
    if (paramName === "SleepQuality" || paramName === "Mood") {
      // Interpolate from red (0) to green (1)
      const red = Math.round(255 * (1 - normalizedValue));
      const green = Math.round(255 * normalizedValue);
      return `rgb(${red}, ${green}, 0)`;
    }
    
    // Fatigue, MuscleSoreness, Stress: higher is worse (1 = green, 10 = red)
    // Interpolate from green (0) to red (1)
    const red = Math.round(255 * normalizedValue);
    const green = Math.round(255 * (1 - normalizedValue));
    return `rgb(${red}, ${green}, 0)`;
  };

  // Prepare data for radar chart
  const chartData = useMemo(() => {
    if (!wellness.length) return [];
    
    const avg = (key: keyof WellnessCheck) => {
      const sum = wellness.reduce((acc, w) => acc + (w[key] as number), 0);
      return Number((sum / wellness.length).toFixed(1));
    };
    
    return [
      { parameter: "Fáradtság", value: avg("Fatigue") },
      { parameter: "Alvás", value: avg("SleepQuality") },
      { parameter: "Izomláz", value: avg("MuscleSoreness") },
      { parameter: "Stressz", value: avg("Stress") },
      { parameter: "Hangulat", value: avg("Mood") },
    ];
  }, [wellness]);

  const chartConfig = {
    wellness: {
      label: "Wellness paraméterek",
      theme: {
        light: "rgb(var(--primary))",
        dark: "rgb(var(--primary))",
      },
    },
  } satisfies ChartConfig;

  const areaChartConfig = {
    index: {
      label: "Érték: ",
      theme: {
        light: "rgb(var(--primary))",
        dark: "rgb(var(--primary))",
      },
    },
  } satisfies ChartConfig;

  // Filter wellness index data based on time range
  // If there's less data than the selected range, show all available data
  const filteredWellnessIndexData = useMemo(() => {
    if (!wellnessIndex.length) return [];
    
    // First, sort all data by date
    const sortedData = wellnessIndex
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
  }, [wellnessIndex, timeRange]);

  // Calculate gradient stops based on actual Y values (0-100 scale assumed for wellness index)
  const gradientStops = useMemo(() => {
    // Assuming wellness index is 0-100, map value ranges to colors
    // 0-33: red zone, 33-66: yellow zone, 66-100: green zone
    // Gradient goes from bottom (0) to top (100), so we reverse: top=green, bottom=red
    return [
      { offset: "0%", color: "#22c55e", opacity: 0.8 },   // top (high values) = green
      { offset: "33%", color: "#22c55e", opacity: 0.6 },  // 66-100 range
      { offset: "50%", color: "#eab308", opacity: 0.5 },  // middle = yellow
      { offset: "67%", color: "#ef4444", opacity: 0.6 },  // 0-33 range
      { offset: "100%", color: "#ef4444", opacity: 0.8 }, // bottom (low values) = red
    ];
  }, []);

  // Calculate trend (comparing last period with previous period)
  const trend = useMemo(() => {
    if (wellness.length < 2) return null;
    const midPoint = Math.floor(wellness.length / 2);
    const recent = wellness.slice(0, midPoint);
    const previous = wellness.slice(midPoint);
    
    const recentAvg = recent.reduce((acc, w) => 
      acc + (w.Fatigue + w.SleepQuality + w.MuscleSoreness + w.Stress + w.Mood) / 5, 0
    ) / recent.length;
    
    const previousAvg = previous.reduce((acc, w) => 
      acc + (w.Fatigue + w.SleepQuality + w.MuscleSoreness + w.Stress + w.Mood) / 5, 0
    ) / previous.length;
    
    if (previousAvg === 0) return null;
    const change = ((recentAvg - previousAvg) / previousAvg) * 100;
    return change;
  }, [wellness]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background lg:pl-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !athlete) {
    return (
      <div className="min-h-screen bg-background lg:pl-64">
        <TopHeader title="Sportoló részletei" />
        <div className="p-8 max-w-3xl mx-auto">
          <Button asChild variant="outline" className="mb-4">
            <Link to="/athletes">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Vissza a sportolókhoz
            </Link>
          </Button>
          <p className="text-destructive">{error || "A sportoló nem található."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:pl-64">
      <TopHeader title={fullName} subtitle={athlete.email} />
      
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="sticky top-20 z-30 -mt-8 pt-8">
            <Button 
              asChild 
              variant="outline" 
              className="fixed left-4 lg:left-72 top-20 transition-all duration-300 hover:translate-x-1"
            >
              <Link to="/athletes">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Vissza a sportolókhoz</span>
                <span className="sm:hidden">Vissza</span>
              </Link>
            </Button>
          </div>

        {/* Alapadatok kártya */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{fullName}</CardTitle>
              <CardDescription>{athlete.email || "Nincs e-mail megadva"}</CardDescription>
            </div>
            <Badge variant={athlete.hasUserAccount ? "default" : "secondary"}>
              {athlete.hasUserAccount ? "App felhasználó" : "Még nincs app fiókja"}
            </Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Magasság</p>
              <p>{athlete.height ? `${athlete.height} cm` : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Testsúly</p>
              <p>{athlete.weight ? `${athlete.weight} kg` : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Wellness adatok</p>
              <p>{wellness.length} mérés az utolsó {days} napban</p>
            </div>
          </CardContent>
        </Card>

        {/* Wellness radar chart */}
        <Card ref={wellnessSummaryRef}>
          <CardHeader className="py-6">
            <div className="flex justify-between items-center min-h-[3rem]">
              <button
              onClick={() => {
                const wasExpanded = expandedCards.wellnessSummary;
                setExpandedCards(prev => ({ ...prev, wellnessSummary: !prev.wellnessSummary }));
                if (!wasExpanded) {
                  setTimeout(() => {
                    scrollToRef(wellnessSummaryRef, -200);
                  }, 350);
                }
              }}
                className="flex items-center gap-3 text-left group flex-1"
              >
                <div>
                  <CardTitle className="group-hover:text-primary transition-colors">Wellness összefoglaló</CardTitle>
                  <CardDescription>Áttekintés a wellness paraméterekről</CardDescription>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform duration-200 flex-shrink-0 ml-auto ${
                    expandedCards.wellnessSummary ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </CardHeader>
          <AnimatePresence mode="wait">
            {expandedCards.wellnessSummary && (
              <motion.div
                key="wellness-summary-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <CardContent className="pb-0 px-6 relative">
                  <div className="flex justify-end mb-4">
                    <TimeRangeSelect value={wellnessSummaryTimeRange} onValueChange={setWellnessSummaryTimeRange} />
                  </div>
            {chartData.length === 0 && !wellnessLoading ? (
              <p className="text-muted-foreground text-center py-8">
                Nincs elérhető wellness adat az utolsó {days} napban.
              </p>
            ) : (
              <div className="relative">
                <div className={`transition-opacity duration-300 ${wellnessLoading ? 'opacity-50' : 'opacity-100'}`}>
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[300px] w-full"
                  >
                      <RadarChart data={chartData} margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
                      <ChartTooltip 
                        cursor={false} 
                        content={
                          <ChartTooltipContent 
                            hideLabel
                            hideIndicator
                            formatter={(value) => value}
                            className="!min-w-0 !w-auto !px-2 !py-1 !text-sm !gap-0"
                          />
                        } 
                      />
                      <PolarAngleAxis 
                        dataKey="parameter" 
                        tick={{ fontSize: 12, fill: 'currentColor' }}
                      />
                      <PolarGrid stroke="rgb(var(--foreground))" strokeOpacity={0.2} />
                      <Radar
                        dataKey="value"
                        fill="rgb(var(--primary))"
                        fillOpacity={0.6}
                        dot={{
                          r: 4,
                          fillOpacity: 1,
                          fill: "rgb(var(--primary))",
                        }}
                      />
                    </RadarChart>
                  </ChartContainer>
                </div>
                {wellnessLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
            )}
                </CardContent>
                {chartData.length > 0 && (
                  <CardFooter className="flex-col gap-2 text-sm">
                    {trend !== null && (
                      <div className="flex items-center gap-2 leading-none font-medium">
                        {trend > 0 ? "Növekedés" : trend < 0 ? "Csökkenés" : "Változatlan"} {trend !== 0 && `${Math.abs(trend).toFixed(1)}%`}
                        {trend > 0 && <TrendingUp className="h-4 w-4" />}
                        {trend < 0 && <TrendingUp className="h-4 w-4 rotate-180" />}
                      </div>
                    )}
                    <div className="text-muted-foreground flex items-center gap-2 leading-none">
                      {wellness.length} mérés az utolsó {days} napban
                    </div>
                  </CardFooter>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Wellness Index Area Chart */}
        <Card ref={wellnessIndexRef}>
          <CardHeader className="py-6">
            <div className="flex justify-between items-center min-h-[3rem]">
              <button
              onClick={() => {
                const wasExpanded = expandedCards.wellnessIndex;
                setExpandedCards(prev => ({ ...prev, wellnessIndex: !prev.wellnessIndex }));
                if (!wasExpanded) {
                  setTimeout(() => {
                    scrollToRef(wellnessIndexRef, -200);
                  }, 350);
                }
              }}
                className="flex items-center gap-3 text-left group flex-1"
              >
                <div className="grid flex-1 gap-1">
                  <CardTitle className="group-hover:text-primary transition-colors">Jólléti állapot indexe (idősor)</CardTitle>
                  <CardDescription>
                    Wellness index változása az idő múlásával
                  </CardDescription>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
                    expandedCards.wellnessIndex ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </CardHeader>
          <AnimatePresence mode="wait">
            {expandedCards.wellnessIndex && (
              <motion.div
                key="wellness-index-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                  <div className="flex justify-end mb-4">
                    <TimeRangeSelect value={timeRange} onValueChange={setTimeRange} />
                  </div>
            {filteredWellnessIndexData.length === 0 && !wellnessIndexLoading ? (
              <p className="text-muted-foreground text-center py-8">
                Nincs elérhető wellness index adat a kiválasztott időszakban.
              </p>
            ) : (
              <div className="relative">
                <div className={`transition-opacity duration-300 ${wellnessIndexLoading ? 'opacity-50' : 'opacity-100'}`}>
                  <ChartContainer
                    config={areaChartConfig}
                    className="aspect-auto h-[250px] w-full"
                  >
                    <AreaChart data={filteredWellnessIndexData}>
                      <defs>
                        <linearGradient id="strokeIndex" x1="0" y1="0" x2="0" y2="1">
                          {gradientStops.map((stop, i) => (
                            <stop
                              key={i}
                              offset={stop.offset}
                              stopColor={stop.color}
                            />
                          ))}
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
                        fill="transparent"
                        stroke="url(#strokeIndex)"
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
                {wellnessIndexLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
            )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Részletes lista */}
        <Card ref={detailedWellnessRef}>
          <CardHeader className="py-6">
            <button
              onClick={() => {
                const wasExpanded = expandedCards.detailedWellness;
                setExpandedCards(prev => ({ ...prev, detailedWellness: !prev.detailedWellness }));
                if (!wasExpanded) {
                  setTimeout(() => {
                    scrollToRef(detailedWellnessRef, -300);
                  }, 350);
                }
              }}
              className="flex items-center gap-3 text-left group w-full"
            >
              <div>
                <CardTitle className="group-hover:text-primary transition-colors">Részletes wellness adatok</CardTitle>
                <CardDescription>Időrendben visszafelé</CardDescription>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform duration-200 flex-shrink-0 ml-auto ${
                  expandedCards.detailedWellness ? 'rotate-180' : ''
                }`}
              />
            </button>
          </CardHeader>
          <AnimatePresence mode="wait">
            {expandedCards.detailedWellness && (
              <motion.div
                key="detailed-wellness-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <CardContent>
            {wellness.length === 0 ? (
              <p className="text-muted-foreground">
                Nincs elérhető wellness adat az utolsó {days} napban.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Dátum</th>
                      <th className="text-center py-3 px-4 font-medium text-sm text-muted-foreground">Fáradtság</th>
                      <th className="text-center py-3 px-4 font-medium text-sm text-muted-foreground">Alvás</th>
                      <th className="text-center py-3 px-4 font-medium text-sm text-muted-foreground">Izomláz</th>
                      <th className="text-center py-3 px-4 font-medium text-sm text-muted-foreground">Stressz</th>
                      <th className="text-center py-3 px-4 font-medium text-sm text-muted-foreground">Hangulat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wellness.map(w => (
                      <tr key={w.Id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium">
                            {new Date(w.Date).toLocaleDateString("hu-HU", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            })}
                          </p>
                          {w.Comment && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {w.Comment}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className="font-medium"
                            style={{ 
                              color: getWellnessBadgeColor("Fatigue", w.Fatigue)
                            }}
                          >
                            {w.Fatigue}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className="font-medium"
                            style={{ 
                              color: getWellnessBadgeColor("SleepQuality", w.SleepQuality)
                            }}
                          >
                            {w.SleepQuality}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className="font-medium"
                            style={{ 
                              color: getWellnessBadgeColor("MuscleSoreness", w.MuscleSoreness)
                            }}
                          >
                            {w.MuscleSoreness}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className="font-medium"
                            style={{ 
                              color: getWellnessBadgeColor("Stress", w.Stress)
                            }}
                          >
                            {w.Stress}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className="font-medium"
                            style={{ 
                              color: getWellnessBadgeColor("Mood", w.Mood)
                            }}
                          >
                            {w.Mood}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
        </div>
      </div>
    </div>
  );
}

