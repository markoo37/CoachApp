namespace CoachCRM.Models;

public class Coach
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    
    // User kapcsolat (ÚJ)
    public int? UserId { get; set; }
    public CoachUser? User { get; set; }

    // Teams kapcsolat
    public List<Team> Teams { get; set; } = new();
}