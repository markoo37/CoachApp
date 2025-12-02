namespace CoachCRM.Dtos;

public class CreateWellnessCheckDto
{
    public int Fatigue { get; set; }
    public int SleepQuality { get; set; }
    public int MuscleSoreness { get; set; }
    public int Stress { get; set; }
    public int Mood { get; set; }
    public string? Comment { get; set; }
}