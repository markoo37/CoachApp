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
    }
}