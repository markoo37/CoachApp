using System.ComponentModel.DataAnnotations;

namespace CoachCRM.Dtos;

public class ChangePasswordDto
{
    [Required]
    [MinLength(1, ErrorMessage = "Current password is required")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required]
    [MinLength(6, ErrorMessage = "New password must be at least 6 characters long")]
    public string NewPassword { get; set; } = string.Empty;
}