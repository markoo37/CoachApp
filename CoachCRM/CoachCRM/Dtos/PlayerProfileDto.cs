namespace CoachCRM.Dtos;

public class PlayerProfileDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public DateTime? BirthDate { get; set; }
    public double? Weight { get; set; }
    public double? Height { get; set; }
    public int? Age { get; set; }
    public List<TeamInfoDto>? Teams { get; set; }

    public bool HasUserAccount { get; set; }
}