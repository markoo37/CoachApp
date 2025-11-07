// src/types/auth.ts

export interface LoginRequest {
  Email: string;
  Password: string;
}

// Extended registration request with all profile fields
export interface RegisterPlayerRequest {
  Email: string;
  Password: string;
  FirstName: string;
  LastName: string;
  BirthDate?: string;
  Weight?: number;
  Height?: number;
}

// Check if email exists among athletes
export interface CheckEmailRequest {
  Email: string;
}

export interface CheckEmailResponse {
  exists: boolean;
  message?: string;
}

export interface PlayerLoginResponse {
  token: string;
  player: {
    Id: number;
    FirstName: string;
    LastName: string;
    Email: string;
    TeamName?: string;
    CoachName?: string;
  };
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface TeamData {
  Id: number;
  Name: string;
  Coach: {
    Id: number;
    FirstName: string;
    LastName: string;
    Email: string;
  };
  PlayerCount: number;
}

export interface TrainingPlanData {
  Id: number;
  Name: string;
  Description: string;
  Date: string;
  StartTime?: string;
  EndTime?: string;
  AthleteId?: number;
  AthleteName?: string;
  TeamId?: number;
  TeamName?: string;
}