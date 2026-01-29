using CoachCRM.Models;

namespace CoachCRM.Services.Auth;

public interface IRefreshTokenService
{
    RefreshToken Generate();
}