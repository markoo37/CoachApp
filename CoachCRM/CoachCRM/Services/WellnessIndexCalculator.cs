using System;
using CoachCRM.Models;

namespace CoachCRM.Services;

public class WellnessIndexCalculator
{
    // -----------------------------
    // Normalizálás (N_i)
    // -----------------------------
    
    // Pozitív skálák: alvás, hangulat
    private static double NormalizePositive(int value)
    {
        return (value - 1.0) / 9.0;
    }

    // Negatív skálák: fáradtság, fájdalom, stressz
    private static double NormalizeNegative(int value)
    {
        return (10.0 - value) / 9.0;
    }

    // -----------------------------
    // AWI paraméterek
    // -----------------------------
    private const double K = 0.20;   // Kritikus küszöb (𝒦)
    private const double Beta = 1.50; // Büntetési faktor (β)
    private const double Gamma = 0.85; // Skálázó kitevő (γ)

    // Nemlinearitások (α_i)
    private const double AlphaFatigue = 1.2;
    private const double AlphaSleep = 1.1;
    private const double AlphaSoreness = 1.3;
    private const double AlphaStress = 1.4;
    private const double AlphaMood = 1.1;

    // -----------------------------
    // Fő számítás
    // -----------------------------
    public static double CalculateIndex(WellnessCheck w)
    {
        // 1. (N_i)
        var fatigueN = NormalizeNegative(w.Fatigue);
        var sleepN = NormalizePositive(w.SleepQuality);
        var sorenessN = NormalizeNegative(w.MuscleSoreness);
        var stressN = NormalizeNegative(w.Stress);
        var moodN = NormalizePositive(w.Mood);

        // 2. (N_i^α_i)
        var fatigueT = Math.Pow(fatigueN, AlphaFatigue);
        var sleepT = Math.Pow(sleepN, AlphaSleep);
        var sorenessT = Math.Pow(sorenessN, AlphaSoreness);
        var stressT = Math.Pow(stressN, AlphaStress);
        var moodT = Math.Pow(moodN, AlphaMood);

        // 3. (w_i) -> sum = 1
        const double wFatigue = 0.20;
        const double wSleep = 0.4;
        const double wSoreness = 0.15;
        const double wStress = 0.15;
        const double wMood = 0.10;

        // Σ w_i * N_i^α_i
        var bigW =
            fatigueT * wFatigue +
            sleepT * wSleep +
            sorenessT * wSoreness +
            stressT * wStress +
            moodT * wMood;

        // 4. Penalty factor
        var minN = new[] { fatigueN, sleepN, sorenessN, stressN, moodN }.Min();
        
        // 1 - max(0, 𝒦 - m) * β
        var penalty = 1.0 - Math.Max(0.0, K - minN) * Beta;
        penalty = Math.Clamp(penalty, 0.0, 1.0);

        var wPrime = bigW * penalty;

        // 5. Scaling -> 0–100: (W')^γ * 100
        var awi01 = Math.Pow(Math.Max(wPrime, 0.0), Gamma);
        var awi100 = Math.Round(awi01 * 100.0);

        return Math.Clamp(awi100, 0.0, 100.0);
    }
}