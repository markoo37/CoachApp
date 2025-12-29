namespace CoachCRM.Dtos;

public class TeamRosterWellnessRowDto
{
    public int AthleteId { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public bool HasUserAccount { get; set; }

    public double? AverageWellnessIndex { get; set; }   // 0..100 (utolsó N kitöltés átlaga)
    public string? LastWellnessDate { get; set; }       // "yyyy-MM-dd"
    public double? LastWellnessIndex { get; set; }      // 0..100

    public int ComplianceCount { get; set; }            // pl. 5 (utolsó 7 napban)
    public int ComplianceWindowDays { get; set; }       // pl. 7

    public string Status { get; set; } = "Unknown";     // "OK" | "Watch" | "Critical" | "NoData"
}