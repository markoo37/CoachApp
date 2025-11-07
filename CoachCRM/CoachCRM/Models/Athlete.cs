using Microsoft.EntityFrameworkCore;

namespace CoachCRM.Models;

[Index(nameof(Email), IsUnique = true)]
public class Athlete
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public double? Weight { get; set; }
    public double? Height { get; set; }
    
    // ÚJ mezők
    public string? Email { get; set; }
    public int? UserId { get; set; }
    public PlayerUser? User { get; set; }
    
    public List<TeamMembership> TeamMemberships { get; set; } = new();
    public ICollection<CoachAthlete> CoachAthletes { get; set; }

}