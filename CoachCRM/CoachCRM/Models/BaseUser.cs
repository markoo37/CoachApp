namespace CoachCRM.Models;

public abstract class BaseUser
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public byte[] PasswordHash { get; set; } = Array.Empty<byte>();
    public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    
    // ÚJ: Konkrét property setter-rel (EF számára)
    public string UserType { get; protected set; } = string.Empty;
}