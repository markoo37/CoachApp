namespace CoachCRM.Dtos;

public class PlayerUserDto : BaseUserDto
{
    public int AthleteId { get; set; }
    public AthleteDto? Athlete { get; set; }
}