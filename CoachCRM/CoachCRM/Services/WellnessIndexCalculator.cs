using CoachCRM.Models;

namespace CoachCRM.Services;

public class WellnessIndexCalculator
{
    private static double NormalizePositive(int value)
    {
        return (value - 1.0) / 9.0;
    }
    
    private static double NormalizeNegative(int value)
    {
        return (10.0 - value) / 9.0;
    }
    
    public static double CalculateIndex(WellnessCheck w)
    {
        double fatigue = NormalizeNegative(w.Fatigue);
        double sleep = NormalizePositive(w.SleepQuality);
        double soreness = NormalizeNegative(w.MuscleSoreness);
        double stress = NormalizeNegative(w.Stress);
        double mood = NormalizePositive(w.Mood);

        // Súlyok (összegük = 1.00)
        const double wFatigue = 0.25;
        const double wSleep = 0.35;
        const double wSoreness = 0.15;
        const double wStress = 0.15;
        const double wMood = 0.10;

        double score01 =
            fatigue * wFatigue +
            sleep * wSleep +
            soreness * wSoreness +
            stress * wStress +
            mood * wMood;

        double score100 = Math.Round(score01 * 100.0);

        return score100; // 0..100
    }
}