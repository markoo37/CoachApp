using System.Security.Claims;

namespace CoachCRM.Security;

public interface ICurrentUserContext
{
    int UserId { get; }
    ClaimsPrincipal Principal { get; }
    
    string? Email { get; }
    string UserType { get; }
    
    int? CoachId { get; }
    int? AthleteId { get; }
}