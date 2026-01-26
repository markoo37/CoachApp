using System.Security.Claims;
using CoachCRM.Errors;

namespace CoachCRM.Extensions;

public static class UserExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
        => int.Parse(user.FindFirst("userId")?.Value
                     ?? throw new UnauthorizedAccessException(ErrorCodes.MissingClaimUserId));

    public static string GetEmail(this ClaimsPrincipal user)
        => user.FindFirst("email")?.Value
           ?? throw new UnauthorizedAccessException("email claim not found");

    public static string GetUserType(this ClaimsPrincipal user)
        => user.FindFirst("userType")?.Value ?? "Unknown";

    public static int? GetCoachId(this ClaimsPrincipal user)
        => int.TryParse(user.FindFirst("coachId")?.Value, out var id) ? id : null;

    public static int? GetAthleteId(this ClaimsPrincipal user)
        => int.TryParse(user.FindFirst("athleteId")?.Value, out var id) ? id : null;

    // ✅ új: kötelezően kell
    public static int RequireCoachId(this ClaimsPrincipal user)
        => user.GetCoachId() ?? throw new UnauthorizedAccessException("coachId claim not found");

    public static int RequireAthleteId(this ClaimsPrincipal user)
        => user.GetAthleteId() ?? throw new UnauthorizedAccessException("athleteId claim not found");
}