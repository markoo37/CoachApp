namespace CoachCRM.Dtos;

public class TeamDailyWellnessIndexPointDto
{
    public string Date { get; set; } = string.Empty; // "yyyy-MM-dd"
    public double? AverageIndex { get; set; }        // 0..100, null ha nincs adat
    public int SampleSize { get; set; }              // hány játékos adott adatot
}