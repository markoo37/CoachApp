namespace CoachCRM.Dtos;

public class CoachDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    
    // ÚJ mező
    public bool HasUserAccount { get; set; }
}