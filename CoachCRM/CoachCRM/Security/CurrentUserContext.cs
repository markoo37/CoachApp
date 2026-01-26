using System.Security.Claims;
using CoachCRM.Errors;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CoachCRM.Security;

public class CurrentUserContext : ICurrentUserContext
{
    public int UserId { get; }
    public ClaimsPrincipal Principal { get; }
    public string? Email { get; }
    public string UserType { get; }
    public int? CoachId { get; }
    public int? AthleteId { get; }

    public CurrentUserContext(IHttpContextAccessor accessor)
    {
        Principal = accessor.HttpContext?.User ?? new ClaimsPrincipal();

        var userIdStr = Principal.FindFirst("userId")?.Value;
        if (!int.TryParse(userIdStr, out var userId))
            throw new UnauthorizedAccessException(ErrorCodes.MissingClaimUserId);

        UserId = userId;
        Email = Principal.FindFirst("email")?.Value;
        UserType = Principal.FindFirst("userType")?.Value ?? "Unknown";
        CoachId = int.TryParse(Principal.FindFirst("coachId")?.Value, out var cId) ? cId : null;
        AthleteId = int.TryParse(Principal.FindFirst("athleteId")?.Value, out var aId) ? aId : null;
    }
}