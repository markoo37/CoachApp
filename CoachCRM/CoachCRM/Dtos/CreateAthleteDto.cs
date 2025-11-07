// CoachCRM/Dtos/CreateAthleteDto.cs
namespace CoachCRM.Dtos
{
    public class CreateAthleteDto
    {
        public string FirstName { get; set; } = null!;
        public string LastName  { get; set; } = null!;
        public DateTime BirthDate { get; set; }
        public double Weight    { get; set; }
        public double Height    { get; set; }
        public int? TeamId       { get; set; }

        // ÚJ mező:
        public string Email     { get; set; } = null!;
    }
}