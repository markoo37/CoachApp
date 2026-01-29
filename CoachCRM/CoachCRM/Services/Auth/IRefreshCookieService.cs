using Microsoft.AspNetCore.Http;

namespace CoachCRM.Services.Auth;

public interface IRefreshCookieService
{
    void Set(HttpContext http, string token, DateTime expiresUtc);
    void Delete(HttpContext http);
}