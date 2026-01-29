using CoachCRM.Models;

namespace CoachCRM.Services.Auth;

public interface IJwtTokenService
{
    string CreateCoachToken(CoachUser user);
    string CreatePlayerToken(PlayerUser user);
}