namespace CoachCRM.Models;

public class Team
{
    public int Id { get; set; }
    public string Name { get; set; }

    // Coach kapcsolat
    public int CoachId { get; set; }
    public Coach? Coach { get; set; }

    // Sportolók (később hozzáadjuk)
    
    public List<TeamMembership> TeamMemberships { get; set; } = new();

    // TrainingPlans kapcsolat
    public List<TrainingPlan> TrainingPlans { get; set; } = new();
}
