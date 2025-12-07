import api from "./api";
import type { WellnessIndex } from "../types/wellnessIndex";

export interface WellnessCheck {
  Id: number;
  Date: string;
  Fatigue: number;
  SleepQuality: number;
  MuscleSoreness: number;
  Stress: number;
  Mood: number;
  Comment?: string;
  AthleteId: number;
  AthleteName: string;
}

export async function getAthleteWellness(athleteId: number, days = 7) {
  const res = await api.get<WellnessCheck[]>(`/wellnesschecks/athletes/${athleteId}`, {
    params: { days },
  });
  return res.data;
}

export async function fetchWellnessIndex(
  athleteId: number,
  from?: string,
  to?: string
): Promise<WellnessIndex[]> {
  type WellnessIndexApi = {
    Date: string;
    Index: number;
  };

  const res = await api.get<WellnessIndexApi[]>(
    `/wellnesschecks/athletes/${athleteId}/wellness-index`,
    {
      params: { from, to },
    }
  );

  // Backend PascalCase → frontend camelCase
  return res.data.map(p => ({
    date: p.Date,
    index: p.Index,
  }));
}