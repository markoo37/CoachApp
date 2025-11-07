using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CoachCRM.Models
{
    public class RefreshToken
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        public DateTime Expires { get; set; }

        public DateTime Created { get; set; } = DateTime.UtcNow;

        public DateTime? Revoked { get; set; }

        // FK kapcsolat a BaseUser-höz (CoachUser helyett)
        [Required]
        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public BaseUser User { get; set; } = null!;

        // Helper properties
        public bool IsExpired => DateTime.UtcNow >= Expires;
        public bool IsRevoked => Revoked != null;
        public bool IsActive => !IsRevoked && !IsExpired;
    }
}