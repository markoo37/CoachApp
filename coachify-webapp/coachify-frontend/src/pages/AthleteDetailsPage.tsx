import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api/api";
import TopHeader from "../components/TopHeader";
import { PageBreadcrumb, useBreadcrumbItems } from "../components/PageBreadcrumb";
import { getAthleteWellness, WellnessCheck } from "../api/wellness";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, ChevronDown, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TimeRange, TimeRangeSelect } from "@/components/TimeRangeSelect";
import { fetchWellnessIndex } from "../api/wellness";
import type { WellnessIndex } from "../types/wellnessIndex";
import { WellnessTable } from "@/components/ui/wellness-table";
import { WellnessIndexChart } from "@/components/ui/wellness-index-chart";

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

  const [wellnessSummaryTimeRange, setWellnessSummaryTimeRange] = useState<TimeRange>("7d");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  
  // Convert wellness summary timeRange to days
  const days = useMemo(() => {
    return wellnessSummaryTimeRange === "7d" ? 7 : wellnessSummaryTimeRange === "30d" ? 30 : 90;
  }, [wellnessSummaryTimeRange]);
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

  // Helper function to toggle a card and close all others
  const toggleCard = (cardKey: keyof typeof expandedCards, ref?: React.RefObject<HTMLDivElement | null>, yOffset: number = -200) => {
    const wasExpanded = expandedCards[cardKey];
    // If opening a card, close all others; if closing, just toggle this one
    if (!wasExpanded) {
      setExpandedCards({
        wellnessSummary: false,
        wellnessIndex: false,
        detailedWellness: false,
        [cardKey]: true,
      });
      if (ref) {
        setTimeout(() => {
          scrollToRef(ref, yOffset);
        }, 350);
      }
    } else {
      setExpandedCards(prev => ({ ...prev, [cardKey]: false }));
    }
  };

  const athleteQuery = useQuery<AthleteDetails>({
    queryKey: ["athlete", athleteId],
    enabled: Boolean(athleteId),
    queryFn: async () => {
      const athleteRes = await api.get(`/athletes/${athleteId}`);
      const a = athleteRes.data;
      return {
        id: a.id ?? a.Id,
        firstName: a.firstName ?? a.FirstName,
        lastName: a.lastName ?? a.LastName,
        email: a.email ?? a.Email,
        weight: a.weight ?? a.Weight,
        height: a.height ?? a.Height,
        hasUserAccount: a.hasUserAccount ?? a.HasUserAccount,
      };
    },
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const wellnessQuery = useQuery<WellnessCheck[]>({
    queryKey: ["athleteWellness", athleteId, days],
    enabled: Boolean(athleteId),
    queryFn: () => getAthleteWellness(athleteId, days),
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev ?? [],
  });

  const allWellnessQuery = useQuery<WellnessCheck[]>({
    queryKey: ["athleteWellnessAll", athleteId, 365],
    enabled: Boolean(athleteId),
    queryFn: () => getAthleteWellness(athleteId, 365),
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    select: (w) => w.slice().sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()),
    placeholderData: [],
  });

  const wellnessIndexQuery = useQuery<WellnessIndex[]>({
    queryKey: ["athleteWellnessIndex", athleteId, timeRange],
    enabled: Boolean(athleteId),
    queryFn: () => {
      const today = new Date();
      const daysToSubtract = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - daysToSubtract);

      const from = fromDate.toISOString().split("T")[0];
      const to = today.toISOString().split("T")[0];

      return fetchWellnessIndex(athleteId, from, to);
    },
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev ?? [],
  });

  const wellness = wellnessQuery.data ?? [];
  const wellnessLoading = wellnessQuery.isFetching;

  const allWellness = allWellnessQuery.data ?? [];
  const allWellnessInitialLoading = allWellnessQuery.isLoading;
  const allWellnessLoading = allWellnessQuery.isFetching;

  const wellnessIndex = wellnessIndexQuery.data ?? [];
  const wellnessIndexLoading = wellnessIndexQuery.isFetching;

  const athlete = athleteQuery.data ?? null;
  const errorMessage = useMemo(() => {
    if (!athleteQuery.error) return null;
    const err: any = athleteQuery.error;
    return err?.message || "Nem sikerült betölteni a sportoló adatait.";
  }, [athleteQuery.error]);

  useEffect(() => {
    if (athleteQuery.error) console.error(athleteQuery.error);
  }, [athleteQuery.error]);

  useEffect(() => {
    if (wellnessQuery.error) console.error(wellnessQuery.error);
  }, [wellnessQuery.error]);

  useEffect(() => {
    if (allWellnessQuery.error) console.error(allWellnessQuery.error);
  }, [allWellnessQuery.error]);

  useEffect(() => {
    if (wellnessIndexQuery.error) console.error(wellnessIndexQuery.error);
  }, [wellnessIndexQuery.error]);

  const fullName = useMemo(() =>
    (athlete?.firstName || athlete?.lastName)
      ? `${athlete?.firstName ?? ""} ${athlete?.lastName ?? ""}`.trim()
      : "Ismeretlen név",
    [athlete]
  );

  const breadcrumbItems = useBreadcrumbItems(fullName);

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

  if (athleteQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background lg:pl-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (errorMessage || !athlete) {
    const errorBreadcrumbItems = useBreadcrumbItems("Hiba");
    return (
      <div className="min-h-screen bg-background lg:pl-64">
        <TopHeader title="Sportoló részletei" />
        <div className="p-8 max-w-7xl mx-auto">
          <PageBreadcrumb items={errorBreadcrumbItems} />
          <p className="text-destructive">{errorMessage || "A sportoló nem található."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:pl-64">
      <TopHeader title={fullName} subtitle={athlete.email} />
      
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <PageBreadcrumb items={breadcrumbItems} />

        {/* Alapadatok kártya */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl">{fullName}</CardTitle>
              {!athlete.hasUserAccount && (
                <Clock className="h-5 w-5 text-yellow-500" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={athlete.hasUserAccount ? "default" : "secondary"}>
                {athlete.hasUserAccount ? "App felhasználó" : "Még nincs app fiókja"}
              </Badge>
            </div>
          </CardHeader>
          <CardDescription className="px-6 pb-4">{athlete.email || "Nincs e-mail megadva"}</CardDescription>
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
              onClick={() => toggleCard('wellnessSummary', wellnessSummaryRef)}
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
              onClick={() => toggleCard('wellnessIndex', wellnessIndexRef)}
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
                  <WellnessIndexChart
                    data={wellnessIndex}
                    timeRange={timeRange}
                    onTimeRangeChange={setTimeRange}
                    loading={wellnessIndexLoading}
                  />
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Részletes lista */}
        <div ref={detailedWellnessRef}>
          <Card>
          <CardHeader className="py-6">
            <button
                onClick={() => toggleCard('detailedWellness', detailedWellnessRef, -300)}
              className="flex items-center gap-3 text-left group w-full"
            >
              <div>
                <CardTitle className="group-hover:text-primary transition-colors">Részletes wellness adatok</CardTitle>
                  <CardDescription>Összes elérhető mérés időrendben visszafelé</CardDescription>
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
                    {allWellnessInitialLoading || allWellnessLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <WellnessTable
                        wellness={allWellness}
                        getWellnessBadgeColor={getWellnessBadgeColor}
                        itemsPerPage={10}
                      />
            )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
        </div>
        </div>
      </div>
    </div>
  );
}

