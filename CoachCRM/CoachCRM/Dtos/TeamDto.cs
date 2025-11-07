namespace CoachCRM.Dtos
{
    public class TeamDto
    {
        public int Id { get; set; }
        public string Name { get; set; }  = null!;
        public int CoachId { get; set; }
    }
}