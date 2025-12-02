namespace CoachCRM.Dtos;

public class WellnessCheckDto
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }

    public int Fatigue { get; set; }
    public int SleepQuality { get; set; }
    public int MuscleSoreness { get; set; }
    public int Stress { get; set; }
    public int Mood { get; set; }
    public string? Comment { get; set; }

    public int AthleteId { get; set; }
    public string AthleteName { get; set; } = string.Empty;
}