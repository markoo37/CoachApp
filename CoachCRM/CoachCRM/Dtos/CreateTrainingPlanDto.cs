namespace CoachCRM.Dtos
{
    public class CreateTrainingPlanDto
    {
        public string Name { get; set; } =  null!;
        public string Description { get; set; }  = null!;
        public DateOnly Date { get; set; }
        public TimeOnly? StartTime { get; set; }
        public TimeOnly? EndTime { get; set; }

        public int? AthleteId { get; set; }
        public int? TeamId { get; set; }
    }
}