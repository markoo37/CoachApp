namespace CoachCRM.Models;

public class CoachAthlete
{
    public int Id { get; set; }
    public int CoachId { get; set; }
    public int AthleteId { get; set; }

    public Coach Coach { get; set; }
    public Athlete Athlete { get; set; }
}
