using System.Security.Claims;

namespace CoachCRM.Extensions
{
    public static class UserExtensions
    {
        public static int GetUserId(this ClaimsPrincipal user)
        {
            var userIdClaim = user.FindFirst("userId")?.Value;

            if (userIdClaim == null)
            {
                throw new Exception("UserId claim not found");
            }

            return int.Parse(userIdClaim);
        }
        
        public static string GetEmail(this ClaimsPrincipal user)
        {
            return user.FindFirst("email")?.Value ?? throw new InvalidOperationException("Email not found in claims");
        }

        public static string GetUserType(this ClaimsPrincipal user)
        {
            return user.FindFirst("userType")?.Value ?? "Unknown";
        }

        public static int? GetCoachId(this ClaimsPrincipal user)
        {
            var coachIdClaim = user.FindFirst("coachId")?.Value;
            return int.TryParse(coachIdClaim, out int coachId) ? coachId : null;
        }

        public static int? GetAthleteId(this ClaimsPrincipal user)
        {
            var athleteIdClaim = user.FindFirst("athleteId")?.Value;
            return int.TryParse(athleteIdClaim, out int athleteId) ? athleteId : null;
        }
    }
}