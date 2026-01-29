using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CoachCRM.Models;
using Microsoft.IdentityModel.Tokens;

namespace CoachCRM.Services.Auth;

public sealed class JwtTokenService : IJwtTokenService
{
    private readonly string _secret;
    private readonly int _accessTokenMinutes;

    public JwtTokenService(IConfiguration config)
    {
        _secret = config["JWT_SECRET"] ?? throw new InvalidOperationException("JWT_SECRET IS MISSING");
        _accessTokenMinutes = int.TryParse(config["JWT_ACCESS_MINUTES"], out var m) ? m : 10;
    }

    public string CreateCoachToken(CoachUser user)
    {
        var claims = new[]
        {
            new Claim("userId", user.Id.ToString()),
            new Claim("email", user.Email),
            new Claim("firstName", user.Coach.FirstName),
            new Claim("lastName", user.Coach.LastName),
            new Claim("userType", "Coach"),
            new Claim("coachId", user.CoachId.ToString())
        };

        return CreateJwt(claims);
    }

    public string CreatePlayerToken(PlayerUser user)
    {
        var claims = new[]
        {
            new Claim("userId", user.Id.ToString()),
            new Claim("athleteId", user.AthleteId.ToString()),
            new Claim("email", user.Email),
            new Claim("firstName", user.Athlete.FirstName),
            new Claim("lastName", user.Athlete.LastName),
            new Claim("userType", "Player")
        };

        return CreateJwt(claims);
    }

    private string CreateJwt(IEnumerable<Claim> claims)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_accessTokenMinutes),
            SigningCredentials = credentials
        };

        var handler = new JwtSecurityTokenHandler();
        return handler.WriteToken(handler.CreateToken(descriptor));
    }
}
