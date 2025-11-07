namespace CoachCRM.Models;

public class CoachUser : BaseUser
{
    public CoachUser()
    {
        UserType = "Coach"; // Constructor-ban beállítjuk
    }
    
    // Coach kapcsolat
    public int CoachId { get; set; }
    public Coach Coach { get; set; } = null!;
}