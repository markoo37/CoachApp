using System.Security.Cryptography;
using CoachCRM.Models;

namespace CoachCRM.Services.Auth;

public sealed class RefreshTokenService : IRefreshTokenService
{
    private readonly int _bytes;
    private readonly int _days;

    public RefreshTokenService(IConfiguration config)
    {
        _bytes = int.TryParse(config["REFRESH_TOKEN_BYTES"], out var b) ? b : 64;
        _days  = int.TryParse(config["REFRESH_TOKEN_DAYS"], out var d) ? d : 30;
    }

    public RefreshToken Generate()
    {
        var randomBytes = new byte[_bytes];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);

        return new RefreshToken
        {
            Token   = Convert.ToBase64String(randomBytes),
            Expires = DateTime.UtcNow.AddDays(_days),
            Created = DateTime.UtcNow
        };
    }
}