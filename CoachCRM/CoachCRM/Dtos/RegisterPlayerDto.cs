// CoachCRM/Dtos/RegisterPlayerDto.cs

using System.ComponentModel.DataAnnotations;

namespace CoachCRM.Dtos
{
    public class RegisterPlayerDto
    {
        [Required, EmailAddress]
        public string Email    { get; set; } = string.Empty;
        [Required, MinLength(6)]
        public string Password { get; set; } = string.Empty;
        
        public string FirstName { get; set; } = string.Empty;
        public string LastName  { get; set; } = string.Empty;

        public DateTime? BirthDate { get; set; }
        public double? Weight      { get; set; }
        public double? Height      { get; set; }
    }
}