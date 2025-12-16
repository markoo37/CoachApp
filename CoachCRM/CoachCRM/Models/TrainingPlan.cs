namespace CoachCRM.Models;

public class TrainingPlan
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public DateOnly Date { get; set; } // Csak a nap
    public TimeOnly? StartTime { get; set; } // Pl. 08:00
    public TimeOnly? EndTime { get; set; } // Pl. 09:30

    
    
    //kapcsolatok
    public int? AthleteId { get; set; }
    public Athlete? Athlete { get; set; }
    
    public int? TeamId { get; set; }
    public Team? Team { get; set; }
}