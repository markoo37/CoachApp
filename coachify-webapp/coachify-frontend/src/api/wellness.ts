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

export interface TeamWellnessIndexAverage {
  athleteId: number;
  firstName?: string;
  lastName?: string;
  averageWellnessIndex: number | null;
  samples: number;
}

interface TeamWellnessIndexAveragesApiResponse {
  TeamId: number;
  From: string;
  To: string;
  Days: number;
  Athletes: Array<{
    AthleteId: number;
    FirstName?: string;
    LastName?: string;
    AverageWellnessIndex: number | null;
    Samples: number;
  }>;
}

export interface TeamWellnessIndexAveragesResponse {
  teamId: number;
  from: string;
  to: string;
  days: number;
  athletes: TeamWellnessIndexAverage[];
}

export async function fetchTeamWellnessIndexAverages(
  teamId: number,
  take: number = 14
): Promise<TeamWellnessIndexAveragesResponse> {
  // Clamp take between 1 and 14
  const clampedTake = Math.max(1, Math.min(14, take));

  const res = await api.get<{
    TeamId: number;
    Take: number;
    Athletes: Array<{
      AthleteId: number;
      FirstName?: string;
      LastName?: string;
      AverageWellnessIndex: number | null;
      Samples: number;
    }>;
  }>(
    `/wellnesschecks/teams/${teamId}/wellness-index/avg-latest`,
    {
      params: { take: clampedTake },
    }
  );

  console.log("API response:", res.data);

  // Convert PascalCase to camelCase
  const result = {
    teamId: res.data.TeamId,
    from: "", // Not used in the new endpoint
    to: "", // Not used in the new endpoint
    days: res.data.Take, // Use Take as days for compatibility
    athletes: res.data.Athletes.map((a) => ({
      athleteId: a.AthleteId,
      firstName: a.FirstName,
      lastName: a.LastName,
      averageWellnessIndex: a.AverageWellnessIndex,
      samples: a.Samples,
    })),
  };

  console.log("Converted result:", result);
  return result;
}

export async function fetchTeamWellnessIndexSeries(
  teamId: number,
  range?: string,
  includeEmptyDays: boolean = true
): Promise<WellnessIndex[]> {
  type TeamDailyWellnessIndexPointApi = {
    Date: string;
    AverageIndex: number | null;
    SampleSize: number;
  };

  const res = await api.get<TeamDailyWellnessIndexPointApi[]>(
    `/wellnesschecks/teams/${teamId}/wellness-index/series`,
    {
      params: {
        range,
        includeEmptyDays,
      },
    }
  );

  // Backend PascalCase → frontend camelCase
  // Filter out entries where AverageIndex is null
  return res.data
    .filter((p) => p.AverageIndex !== null)
    .map((p) => ({
      date: p.Date,
      index: p.AverageIndex!,
    }));
}

export type RosterWellnessStatus = "OK" | "Watch" | "Critical" | "NoData";

export interface TeamRosterWellnessRow {
  athleteId: number;
  firstName: string;
  lastName: string;
  hasUserAccount: boolean;
  averageWellnessIndex: number | null;
  lastWellnessDate: string | null;
  lastWellnessIndex: number | null;
  complianceCount: number;
  complianceWindowDays: number;
  status: RosterWellnessStatus;
}

export interface TeamRosterWellnessResponse {
  teamId: number;
  take: number;
  windowDays: number;
  athletes: TeamRosterWellnessRow[];
}

export async function fetchTeamRosterWellness(
  teamId: number,
  take: number = 14,
  windowDays: number = 7
): Promise<TeamRosterWellnessResponse> {
  // Clamp values to safe ranges
  const clampedTake = Math.max(1, Math.min(30, take));
  const clampedWindowDays = Math.max(1, Math.min(30, windowDays));

  const res = await api.get<{
    TeamId: number;
    Take: number;
    WindowDays: number;
    Athletes: Array<{
      AthleteId: number;
      FirstName: string;
      LastName: string;
      HasUserAccount: boolean;
      AverageWellnessIndex: number | null;
      LastWellnessDate: string | null;
      LastWellnessIndex: number | null;
      ComplianceCount: number;
      ComplianceWindowDays: number;
      Status: RosterWellnessStatus;
    }>;
  }>(`/wellnesschecks/teams/${teamId}/roster-wellness`, {
    params: {
      take: clampedTake,
      windowDays: clampedWindowDays,
    },
  });

  // Convert PascalCase to camelCase
  return {
    teamId: res.data.TeamId,
    take: res.data.Take,
    windowDays: res.data.WindowDays,
    athletes: res.data.Athletes.map((a) => ({
      athleteId: a.AthleteId,
      firstName: a.FirstName,
      lastName: a.LastName,
      hasUserAccount: a.HasUserAccount,
      averageWellnessIndex: a.AverageWellnessIndex,
      lastWellnessDate: a.LastWellnessDate,
      lastWellnessIndex: a.LastWellnessIndex,
      complianceCount: a.ComplianceCount,
      complianceWindowDays: a.ComplianceWindowDays,
      status: a.Status,
    })),
  };
}