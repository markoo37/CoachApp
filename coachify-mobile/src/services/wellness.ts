import api from './api';

export interface WellnessCheck {
    fatigue: number;
    sleepQuality: number;
    muscleSoreness: number;
    stress: number;
    mood: number;
    comment: string;
}

export interface WellnessCheckResponse {
    id: number;
    date: string;
    athleteId: number;
    athleteName: string;
}

export async function getTodayWellnessCheck() {
    const response = await api.get<WellnessCheckResponse | null>('/wellnesschecks/me/today');
    return response.data;
}

export async function createTodayWellnessCheck(check: WellnessCheck) {
    const response = await api.post<WellnessCheckResponse>('/wellnesschecks/me/today', check);
    return response.data;
}