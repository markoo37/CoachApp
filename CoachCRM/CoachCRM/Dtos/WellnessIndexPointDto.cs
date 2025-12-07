namespace CoachCRM.Dtos;

public class WellnessIndexPointDto
{
    public string Date { get; set; } = string.Empty;   // "yyyy-MM-dd"
    public double Index { get; set; }                  // 0..100
}