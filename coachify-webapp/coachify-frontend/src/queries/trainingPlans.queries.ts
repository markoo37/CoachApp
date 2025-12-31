import { useQuery } from "@tanstack/react-query";
import api from "../api/api";

export interface TrainingPlanDto {
  Id: number;
  Name: string;
  Description: string;
  Date: string; // DateOnly from backend (YYYY-MM-DD)
  StartTime?: string; // TimeOnly from backend (HH:mm[:ss])
  EndTime?: string; // TimeOnly from backend (HH:mm[:ss])
  AthleteId?: number;
  AthleteName?: string;
  TeamId?: number;
  TeamName?: string;
}

export const trainingPlansRangeKey = (from: string, to: string) =>
  ["trainingplans", "range", from, to] as const;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function formatDateOnly(date: Date): string {
  // Use local date parts (backend DateOnly has no timezone).
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function useTrainingPlansInRangeQuery(from?: Date, to?: Date) {
  const fromStr = from ? formatDateOnly(from) : undefined;
  const toStr = to ? formatDateOnly(to) : undefined;

  return useQuery<TrainingPlanDto[], Error>({
    queryKey: fromStr && toStr ? trainingPlansRangeKey(fromStr, toStr) : ["trainingplans", "range"],
    enabled: Boolean(fromStr && toStr),
    queryFn: async () => {
      const res = await api.get<TrainingPlanDto[]>("/trainingplans/range", {
        params: { from: fromStr, to: toStr },
      });
      return res.data;
    },
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
    placeholderData: [],
  });
}


