namespace CoachCRM.Dtos;

public class TeammateDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public double? Weight { get; set; }
    public double? Height { get; set; }
    public int? Age { get; set; }
}