namespace CoachCRM.Dtos;

public class CoachUserDto : BaseUserDto
{
    public int CoachId { get; set; }
    public CoachDto? Coach { get; set; }
}