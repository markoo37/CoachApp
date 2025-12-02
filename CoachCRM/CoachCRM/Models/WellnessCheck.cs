using System.ComponentModel.DataAnnotations;

namespace CoachCRM.Models;

public class WellnessCheck
{
    public int Id { get; set; }
    
    public int AthleteId { get; set; }
    public Athlete Athlete { get; set; } = null!;
    
    public DateOnly Date { get; set; }
    
    //1-10es skala
    [Range(1, 10)]
    public int Fatigue { get; set; }
    [Range(1, 10)]
    public int SleepQuality { get; set; }
    [Range(1, 10)]
    public int MuscleSoreness { get; set; }
    [Range(1, 10)]
    public int Stress { get; set; }
    [Range(1, 10)]
    public int Mood  { get; set; }
    
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}