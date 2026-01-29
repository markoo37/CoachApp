using System.Security.Cryptography;
using System.Text;
using CoachCRM.Data;
using CoachCRM.Dtos;
using CoachCRM.Errors;
using CoachCRM.Models;
using Microsoft.EntityFrameworkCore;

namespace CoachCRM.Services.Auth;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly ILogger<AuthService> _logger;
    private readonly IJwtTokenService _jwtService;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly IRefreshCookieService _refreshCookieService;

    public AuthService(AppDbContext db,
        ILogger<AuthService> logger,
        IConfiguration config,
        IJwtTokenService jwtService, 
        IRefreshTokenService refreshTokenService,
        IRefreshCookieService refreshCookieService)
    {
        _db = db;
        _logger = logger;
        _jwtService = jwtService;
        _refreshTokenService = refreshTokenService;
        _refreshCookieService = refreshCookieService;
    }
    
    public async Task RegisterCoachAsync(RegisterDto dto, CancellationToken ct = default)
    {
        var email = NormalizeEmail(dto.Email);

        var exists = await _db.Users.AnyAsync(u => u.Email.ToLower() == email, ct);
        if (exists)
            throw new ConflictAppException(ErrorCodes.AuthUserAlreadyExists);

        CreatePasswordHash(dto.Password, out var hash, out var salt);
        
        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var coach = new Coach
        {
            FirstName = dto.FirstName,
            LastName  = dto.LastName,
            Email     = email
        };
        _db.Coaches.Add(coach);
        await _db.SaveChangesAsync(ct);

        var user = new CoachUser
        {
            Email        = email,
            PasswordHash = hash,
            PasswordSalt = salt,
            CoachId      = coach.Id
        };
        _db.CoachUsers.Add(user);
        await _db.SaveChangesAsync(ct);

        coach.UserId = user.Id;
        await _db.SaveChangesAsync(ct);

        await tx.CommitAsync(ct);
    }

    public async Task RegisterPlayerAsync(RegisterPlayerDto dto, CancellationToken ct = default)
    {
        var email = NormalizeEmail(dto.Email);

        // 1) email ne legyen használatban
        var emailInUse = await _db.Users.AnyAsync(u => u.Email.ToLower() == email, ct);
        if (emailInUse)
            throw new ConflictAppException(ErrorCodes.AuthEmailInUse);

        // 2) athlete lookup
        var athlete = await _db.Athletes.FirstOrDefaultAsync(a => a.Email.ToLower() == email, ct);

        if (athlete != null && athlete.UserId != null)
            throw new ConflictAppException(ErrorCodes.AuthAthleteAlreadyRegistered);

        // 3) password hash
        CreatePasswordHash(dto.Password, out var hash, out var salt);
        
        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        if (athlete == null)
        {
            athlete = new Athlete
            {
                Email     = email,
                FirstName = dto.FirstName,
                LastName  = dto.LastName,
                BirthDate = dto.BirthDate,
                Weight    = dto.Weight,
                Height    = dto.Height
            };

            _db.Athletes.Add(athlete);
            await _db.SaveChangesAsync(ct); // kell az Id-hez
        }
        else
        {
            athlete.FirstName = dto.FirstName;
            athlete.LastName  = dto.LastName;
            athlete.BirthDate = dto.BirthDate;
            athlete.Weight    = dto.Weight;
            athlete.Height    = dto.Height;
            // SaveChanges majd lent, együtt
        }

        // 5) PlayerUser létrehozása
        var user = new PlayerUser
        {
            Email        = email,
            PasswordHash = hash,
            PasswordSalt = salt,
            AthleteId    = athlete.Id
        };

        _db.PlayerUsers.Add(user);
        await _db.SaveChangesAsync(ct);

        // 6) Athlete → UserId
        athlete.UserId = user.Id;
        await _db.SaveChangesAsync(ct);

        await tx.CommitAsync(ct);
    }

    public async Task<string> LoginCoachAsync(LoginDto dto, HttpContext http, CancellationToken ct = default)
    {
        var email = NormalizeEmail(dto.Email);

        var user = await _db.CoachUsers
            .Include(u => u.Coach)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email, ct);

        if (user == null || !VerifyPasswordHash(dto.Password, user.PasswordHash, user.PasswordSalt))
        {
            _logger.LogWarning(
                "Failed coach login email={Email} ip={IP}",
                email,
                http.Connection.RemoteIpAddress?.ToString()
            );

            throw new UnauthorizedAppException(ErrorCodes.AuthInvalidCredentials);
        }
        
        var token = _jwtService.CreateCoachToken(user);
        // Refresh token persist
        var refresh = _refreshTokenService.Generate();
        refresh.UserId = user.Id;

        _db.RefreshTokens.Add(refresh);

        // last login
        user.LastLoginAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        // cookie
        _refreshCookieService.Set(http, refresh.Token, refresh.Expires);

        return token;
    }

    public async Task<(string Token, PlayerLoginResponseDto Player)> LoginPlayerAsync(LoginDto dto, HttpContext http, CancellationToken ct = default)
    {
        var email = NormalizeEmail(dto.Email);

        var user = await _db.PlayerUsers
            .Include(u => u.Athlete)
            .ThenInclude(a => a.TeamMemberships)
            .ThenInclude(tm => tm.Team)
            .ThenInclude(t => t.Coach)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email, ct);

        if (user == null || !VerifyPasswordHash(dto.Password, user.PasswordHash, user.PasswordSalt))
            throw new UnauthorizedAppException(ErrorCodes.AuthInvalidCredentials);

        var accessToken = _jwtService.CreatePlayerToken(user);

        var refresh = _refreshTokenService.Generate();
        refresh.UserId = user.Id;

        _db.RefreshTokens.Add(refresh);

        user.LastLoginAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        _refreshCookieService.Set(http, refresh.Token, refresh.Expires);

        var firstMembership = user.Athlete.TeamMemberships.FirstOrDefault();

        var profile = new PlayerLoginResponseDto
        {
            Id        = user.Athlete.Id,
            FirstName = user.Athlete.FirstName,
            LastName  = user.Athlete.LastName,
            Email     = user.Email,
            TeamNames = firstMembership != null
                ? new List<string> { firstMembership.Team.Name }
                : new List<string>(),
            CoachNames = firstMembership?.Team.Coach != null
                ? new List<string> { $"{firstMembership.Team.Coach.FirstName} {firstMembership.Team.Coach.LastName}" }
                : new List<string>()
        };

        return (accessToken, profile);
    }

    public async Task<(bool Exists, bool HasAccount)> CheckEmailAsync(CheckEmailDto dto, CancellationToken ct = default)
    {
        var email = NormalizeEmail(dto.Email);

        var athlete = await _db.Athletes
            .FirstOrDefaultAsync(a => a.Email.ToLower() == email, ct);

        return athlete == null ? (false, false) : (true, athlete.UserId != null);
    }

    public async Task<string> RefreshAsync(HttpContext http, CancellationToken ct = default)
    {
        if (!http.Request.Cookies.TryGetValue("refreshToken", out var rtValue))
            throw new UnauthorizedAppException(ErrorCodes.AuthRefreshMissing);

        var oldRt = await _db.RefreshTokens.FirstOrDefaultAsync(x => x.Token == rtValue, ct);

        if (oldRt == null || oldRt.IsExpired || oldRt.IsRevoked)
            throw new UnauthorizedAppException(ErrorCodes.AuthRefreshInvalid);

        oldRt.Revoked = DateTime.UtcNow;

        var newRt = _refreshTokenService.Generate();
        newRt.UserId = oldRt.UserId;
        _db.RefreshTokens.Add(newRt);

        var baseUser = await _db.Users.FindAsync(new object?[] { oldRt.UserId }, ct);
        if (baseUser == null)
            throw new UnauthorizedAppException(ErrorCodes.AuthUserNotFound);

        var newJwt = baseUser switch
        {
            CoachUser cu  => _jwtService.CreateCoachToken(await LoadCoachUserAsync(cu.Id, ct)),
            PlayerUser pu => _jwtService.CreatePlayerToken(await LoadPlayerUserAsync(pu.Id, ct)),
            _ => throw new InvalidOperationException("Unknown user type in refresh flow")
        };

        await _db.SaveChangesAsync(ct);

        _refreshCookieService.Set(http, newRt.Token, newRt.Expires);

        return newJwt;
    }

    public async Task LogoutAsync(HttpContext http, CancellationToken ct = default)
    {
        if (http.Request.Cookies.TryGetValue("refreshToken", out var rtValue))
        {
            var rt = await _db.RefreshTokens.FirstOrDefaultAsync(x => x.Token == rtValue, ct);
            if (rt != null && !rt.IsRevoked)
            {
                rt.Revoked = DateTime.UtcNow;
                await _db.SaveChangesAsync(ct);
            }
        }

        _refreshCookieService.Delete(http);
    }

    // -------------------------
    // PRIVATE HELPERS
    // -------------------------

    private static string NormalizeEmail(string email)
        => email.Trim().ToLowerInvariant();

    private static void CreatePasswordHash(string password, out byte[] hash, out byte[] salt)
    {
        using var hmac = new HMACSHA512();
        salt = hmac.Key;
        hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
    }

    private static bool VerifyPasswordHash(string password, byte[] storedHash, byte[] storedSalt)
    {
        using var hmac = new HMACSHA512(storedSalt);
        return hmac.ComputeHash(Encoding.UTF8.GetBytes(password)).SequenceEqual(storedHash);
    }

    private async Task<CoachUser> LoadCoachUserAsync(int userId, CancellationToken ct)
        => await _db.CoachUsers.Include(u => u.Coach).FirstAsync(u => u.Id == userId, ct);

    private async Task<PlayerUser> LoadPlayerUserAsync(int userId, CancellationToken ct)
        => await _db.PlayerUsers
            .Include(u => u.Athlete)
                .ThenInclude(a => a.TeamMemberships)
                    .ThenInclude(tm => tm.Team)
                    .ThenInclude(t => t.Coach)
            .FirstAsync(u => u.Id == userId, ct);
}