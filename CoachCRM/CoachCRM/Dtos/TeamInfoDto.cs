namespace CoachCRM.Dtos;

public class TeamInfoDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public CoachInfoDto? Coach { get; set; }
    public int PlayerCount { get; set; }
}