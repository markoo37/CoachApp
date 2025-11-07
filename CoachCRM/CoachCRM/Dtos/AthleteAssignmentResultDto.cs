namespace CoachCRM.Dtos;

public class AthleteAssignmentResultDto
{
    public int AthleteId { get; set; }
    public int TeamId { get; set; }
    public bool HasUserAccount { get; set; }
}