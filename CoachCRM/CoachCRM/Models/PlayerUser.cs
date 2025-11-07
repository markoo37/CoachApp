namespace CoachCRM.Models;

public class PlayerUser : BaseUser
{
    public PlayerUser()
    {
        UserType = "Player"; // Constructor-ban beállítjuk
    }
    
    // Athlete kapcsolat
    public int AthleteId { get; set; }
    public Athlete Athlete { get; set; } = null!;
}