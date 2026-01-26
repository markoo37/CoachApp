namespace CoachCRM.Errors;

public class ErrorCodes
{
    public const string UnknownError = "UNKNOWN_ERROR";
    public const string PlayerProfileNotFound = "PLAYER_PROFILE_NOT_FOUND";
    public const string CoachNotFound = "COACH_NOT_FOUND";
    public const string UserNotFound = "USER_NOT_FOUND";
    public const string UserAlreadyExists = "USER_ALREADY_EXISTS";
    public const string CoachAlreadyExists = "COACH_ALREADY_EXISTS";
    public const string TeamNotOwned = "TEAM_NOT_OWNED";
    public const string AthleteNotLinked = "ATHLETE_NOT_LINKED";
    public const string WellnessAlreadyExists = "WELLNESS_ALREADY_EXISTS";
    public const string InvalidRequest = "INVALID_REQUEST";
    public const string Unauthorized = "UNAUTHORIZED";
    public const string MissingClaimUserId = "MISSING_CLAIM_USERID";
    public const string MissingClaimCoachId = "MISSING_CLAIM_COACHID";
    public const string MissingClaimAthleteId = "MISSING_CLAIM_ATHLETEID";
}