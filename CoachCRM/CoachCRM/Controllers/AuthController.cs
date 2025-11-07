using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using CoachCRM.Data;
using CoachCRM.Models;
using CoachCRM.Dtos;
using CoachCRM.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;

namespace CoachCRM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // COACH REGISTRATION
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("User already exists");

            CreatePasswordHash(dto.Password, out byte[] passwordHash, out byte[] passwordSalt);

            var coach = new Coach
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email
            };

            _context.Coaches.Add(coach);
            await _context.SaveChangesAsync();

            var user = new CoachUser
            {
                Email = dto.Email,
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt,
                CoachId = coach.Id
            };

            _context.CoachUsers.Add(user);
            await _context.SaveChangesAsync();

            coach.UserId = user.Id;
            await _context.SaveChangesAsync();

            return Ok("Coach account created successfully");
        }

        // PLAYER REGISTRATION
        [AllowAnonymous]
        [HttpPost("register-player")]
        public async Task<IActionResult> RegisterPlayer(RegisterPlayerDto dto)
        {
            // 1) Meglévő Athlete keresése az email alapján
            var athlete = await _context.Athletes
                .FirstOrDefaultAsync(a => a.Email == dto.Email.Trim().ToLower());

            if (athlete == null)
                return BadRequest( new { message = "Nincs ilyen email-lel regisztrált sportoló. Kérjük, vedd fel a kapcsolatot az edződdel."});

            // 2) Ellenőrizzük, hogy még nincs-e user account
            if (athlete.UserId != null)
                return BadRequest(new { message = "Ez a sportoló már regisztrált."} );

            if (await _context.Users.AnyAsync(u => u.Email == dto.Email.Trim().ToLower()))
                return BadRequest(new { message = "Ez az email már foglalt."});

            // 3) Jelszó hash-elése
            CreatePasswordHash(dto.Password, out var hash, out var salt);

            // 4) PlayerUser létrehozása
            var user = new PlayerUser
            {
                Email        = dto.Email.Trim().ToLower(),
                PasswordHash = hash,
                PasswordSalt = salt,
                AthleteId    = athlete.Id
            };
            _context.PlayerUsers.Add(user);
            await _context.SaveChangesAsync();

            // 5) Athlete frissítése
            athlete.UserId = user.Id;
            await _context.SaveChangesAsync();

            return Ok("Sportoló fiók sikeresen létrejött!");
        }



        // COACH LOGIN
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var user = await _context.CoachUsers
                .Include(u => u.Coach)
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null || !VerifyPasswordHash(dto.Password, user.PasswordHash, user.PasswordSalt))
                return Unauthorized("Invalid credentials");

            string token = CreateCoachToken(user);

            var refreshToken = GenerateRefreshToken();
            refreshToken.UserId = user.Id;
            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            Response.Cookies.Append("refreshToken", refreshToken.Token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = refreshToken.Expires
            });

            return Ok(new { token });
        }

        // PLAYER LOGIN
        [AllowAnonymous]
        [HttpPost("login-player")]
        public async Task<IActionResult> LoginPlayer(LoginDto dto)
        {
            var user = await _context.PlayerUsers
                .Include(u => u.Athlete)
                    .ThenInclude(a => a.TeamMemberships)
                        .ThenInclude(tm => tm.Team)
                        .ThenInclude(t => t.Coach)
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null || !VerifyPasswordHash(dto.Password, user.PasswordHash, user.PasswordSalt))
                return Unauthorized("Invalid credentials");

            string token = CreatePlayerToken(user);

            var refreshToken = GenerateRefreshToken();
            refreshToken.UserId = user.Id;
            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            Response.Cookies.Append("refreshToken", refreshToken.Token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = refreshToken.Expires
            });

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

            return Ok(new { token, player = profile });
        }

        // REFRESH TOKEN
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
        {
            if (!Request.Cookies.TryGetValue("refreshToken", out var rtValue))
                return Unauthorized("No refresh token");

            var rt = await _context.RefreshTokens.FirstOrDefaultAsync(x => x.Token == rtValue);
            if (rt == null || rt.IsExpired || rt.IsRevoked)
                return Unauthorized("Invalid refresh token");

            var baseUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == rt.UserId);
            if (baseUser == null)
                return Unauthorized("User not found");

            string newToken = baseUser switch
            {
                CoachUser cu  => CreateCoachToken(await LoadCoachUserAsync(cu.Id)),
                PlayerUser pu => CreatePlayerToken(await LoadPlayerUserAsync(pu.Id)),
                _             => throw new InvalidOperationException("Unknown user type")
            };

            return Ok(new { token = newToken });
        }

        // LOGOUT
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            if (!Request.Cookies.TryGetValue("refreshToken", out var rtValue))
                return Ok();

            var rt = await _context.RefreshTokens.FirstOrDefaultAsync(x => x.Token == rtValue);
            if (rt != null)
            {
                rt.Revoked = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            Response.Cookies.Delete("refreshToken");
            return Ok("Logged out");
        }

        // PRIVATE HELPERS
        private void CreatePasswordHash(string password, out byte[] hash, out byte[] salt)
        {
            using var hmac = new HMACSHA512();
            salt = hmac.Key;
            hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        }

        private bool VerifyPasswordHash(string password, byte[] storedHash, byte[] storedSalt)
        {
            using var hmac = new HMACSHA512(storedSalt);
            return hmac.ComputeHash(Encoding.UTF8.GetBytes(password)).SequenceEqual(storedHash);
        }

        private string CreateCoachToken(CoachUser user)
        {
            var secret = Environment.GetEnvironmentVariable("JWT_SECRET");
            var claims = new[]
            {
                new Claim("userId", user.Id.ToString()),
                new Claim("email", user.Email),
                new Claim("firstName", user.Coach.FirstName),
                new Claim("lastName", user.Coach.LastName),
                new Claim("userType", "Coach"),
                new Claim("coachId", user.CoachId.ToString())
            };
            return GenerateJwtToken(claims, secret!);
        }

        private string CreatePlayerToken(PlayerUser user)
        {
            var secret = Environment.GetEnvironmentVariable("JWT_SECRET");
            var claims = new[]
            {
                new Claim("userId", user.Id.ToString()),
                new Claim("athleteId", user.AthleteId.ToString()),
                new Claim("email", user.Email),
                new Claim("firstName", user.Athlete.FirstName),
                new Claim("lastName", user.Athlete.LastName),
                new Claim("userType", "Player")
            };
            return GenerateJwtToken(claims, secret!);
        }

        private async Task<CoachUser> LoadCoachUserAsync(int userId)
            => await _context.CoachUsers.Include(u => u.Coach).FirstAsync(u => u.Id == userId);

        private async Task<PlayerUser> LoadPlayerUserAsync(int userId)
            => await _context.PlayerUsers
                .Include(u => u.Athlete)
                    .ThenInclude(a => a.TeamMemberships)
                        .ThenInclude(tm => tm.Team)
                        .ThenInclude(t => t.Coach)
                .FirstAsync(u => u.Id == userId);

        private string GenerateJwtToken(Claim[] claims, string secret)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(12),
                SigningCredentials = creds
            };
            var handler = new JwtSecurityTokenHandler();
            return handler.WriteToken(handler.CreateToken(tokenDescriptor));
        }

        private RefreshToken GenerateRefreshToken()
        {
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            return new RefreshToken
            {
                Token = Convert.ToBase64String(randomBytes),
                Expires = DateTime.UtcNow.AddDays(30),
                Created = DateTime.UtcNow
            };
        }

                [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
        {
            // Get current user ID from JWT claims
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized("Invalid user token");
            }

            // Find user (works for both CoachUser and PlayerUser)
            BaseUser? userEntity = await _context.CoachUsers
                .FirstOrDefaultAsync(u => u.Id == userId) as BaseUser;
            if (userEntity == null)
            {
                userEntity = await _context.PlayerUsers
                    .FirstOrDefaultAsync(u => u.Id == userId) as BaseUser;
                if (userEntity == null)
                {
                    return NotFound("User not found");
                }
            }

            // Verify current password
            if (!VerifyPasswordHash(dto.CurrentPassword, userEntity.PasswordHash, userEntity.PasswordSalt))
            {
                return BadRequest("Current password is incorrect");
            }

            // Generate new password hash
            CreatePasswordHash(dto.NewPassword, out byte[] newPasswordHash, out byte[] newPasswordSalt);

            // Update password
            userEntity.PasswordHash = newPasswordHash;
            userEntity.PasswordSalt = newPasswordSalt;
    
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully" });
        }
    }
}
