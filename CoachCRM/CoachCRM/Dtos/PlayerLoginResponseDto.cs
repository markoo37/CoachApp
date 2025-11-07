public class PlayerLoginResponseDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName  { get; set; } = string.Empty;
    public string Email     { get; set; } = string.Empty;
    
    // Több csapat neve
    public List<string> TeamNames  { get; set; } = new();
    // Több edző neve (Distinct, ha ugyanaz az edző több csapatnál is)
    public List<string> CoachNames { get; set; } = new();
}