namespace CoachCRM.Errors;

public class ErrorCodes
{
    public const string UnknownError = "UNKNOWN_ERROR";
    public const string PlayerProfileNotFound = "PLAYER_PROFILE_NOT_FOUND";
    public const string CoachNotFound = "COACH_NOT_FOUND";
    public const string CoachAlreadyExists = "COACH_ALREADY_EXISTS";
    public const string UserNotFound = "USER_NOT_FOUND";
    public const string UserAlreadyExists = "USER_ALREADY_EXISTS";
    public const string TeamNotOwned = "TEAM_NOT_OWNED";
    public const string AthleteNotLinked = "ATHLETE_NOT_LINKED";
    public const string WellnessAlreadyExists = "WELLNESS_ALREADY_EXISTS";
    public const string InvalidRequest = "INVALID_REQUEST";
    public const string Unauthorized = "UNAUTHORIZED";
    public const string MissingClaimUserId = "MISSING_CLAIM_USERID";
    public const string MissingClaimCoachId = "MISSING_CLAIM_COACHID";
    public const string MissingClaimAthleteId = "MISSING_CLAIM_ATHLETEID";
    //AUTH codes
    public const string AuthUserAlreadyExists        = "AUTH_USER_ALREADY_EXISTS";
    public const string AuthEmailInUse               = "AUTH_EMAIL_IN_USE";
    public const string AuthAthleteNotFound          = "AUTH_ATHLETE_NOT_FOUND";
    public const string AuthAthleteAlreadyRegistered = "AUTH_ATHLETE_ALREADY_REGISTERED";
    public const string AuthInvalidCredentials       = "AUTH_INVALID_CREDENTIALS";
    public const string AuthRefreshMissing           = "AUTH_REFRESH_MISSING";
    public const string AuthRefreshInvalid           = "AUTH_REFRESH_INVALID";
    public const string AuthInvalidToken             = "AUTH_INVALID_TOKEN";
    public const string AuthUserNotFound             = "AUTH_USER_NOT_FOUND";
    public const string AuthCurrentPasswordWrong     = "AUTH_CURRENT_PASSWORD_WRONG";
    public const string AuthUnknownUserType          = "AUTH_UNKNOWN_USER_TYPE";
}