namespace CoachCRM.Models;

public class TeamMembership
{
    public int Id { get; set; }

    public int AthleteId { get; set; }
    public Athlete Athlete { get; set; } = null!;

    public int TeamId { get; set; }
    public Team Team { get; set; } = null!;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public string Role { get; set; } = "player"; // opcionális
}