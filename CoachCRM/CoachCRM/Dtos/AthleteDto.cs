namespace CoachCRM.Dtos;

public class AthleteDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public double? Weight { get; set; }
    public double? Height { get; set; }
    public List<int> TeamIds { get; set; }

    
    // ÚJ mezők
    public string? Email { get; set; }
    public bool HasUserAccount { get; set; }
}