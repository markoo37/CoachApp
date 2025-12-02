import api from "./api";

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
