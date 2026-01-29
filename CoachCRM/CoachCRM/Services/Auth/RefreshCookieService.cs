namespace CoachCRM.Services.Auth;

public sealed class RefreshCookieService : IRefreshCookieService
{
    private readonly string _cookieName;
    private readonly bool _secure;
    private readonly SameSiteMode _sameSite;

    public RefreshCookieService(IConfiguration config)
    {
        _cookieName = config["REFRESH_COOKIE_NAME"] ?? "refreshToken";

        // Local devnél gyakori, hogy HTTPS nincs -> ilyenkor Secure=false kellhet.
        // Prod: Secure=true
        _secure = !bool.TryParse(config["REFRESH_COOKIE_SECURE"], out var s) || s;

        // Ha cross-site (külön domain/port FE<->BE), akkor None kell + Secure=true
        var sameSite = config["REFRESH_COOKIE_SAMESITE"] ?? "None";
        _sameSite = sameSite.ToLowerInvariant() switch
        {
            "lax" => SameSiteMode.Lax,
            "strict" => SameSiteMode.Strict,
            _ => SameSiteMode.None
        };
    }

    public void Set(HttpContext http, string token, DateTime expiresUtc)
    {
        http.Response.Cookies.Append(_cookieName, token, new CookieOptions
        {
            HttpOnly = true,
            Secure   = _secure,
            SameSite = _sameSite,
            Expires  = expiresUtc
        });
    }

    public void Delete(HttpContext http)
    {
        http.Response.Cookies.Delete(_cookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure   = _secure,
            SameSite = _sameSite
        });
    }
}