using CoachCRM.Dtos;

namespace CoachCRM.Services;

public interface IAuthService
{
    //REGISTRATION
    Task RegisterCoachAsync(RegisterDto dto, CancellationToken ct = default);
    Task RegisterPlayerAsync(RegisterPlayerDto dto, CancellationToken ct = default);
    
    //LOGIN
    Task<string> LoginCoachAsync(LoginDto dto, HttpContext http, CancellationToken ct = default);

    
    //token + player profile
    Task<(string Token, PlayerLoginResponseDto Player)> LoginPlayerAsync(LoginDto dto, HttpContext http, CancellationToken ct = default);
    
    //check email
    Task<(bool Exists, bool HasAccount)> CheckEmailAsync(CheckEmailDto dto, CancellationToken ct = default);
    
    //refresh token
    Task<string> RefreshAsync(HttpContext http, CancellationToken ct = default);
    
    //logout
    Task LogoutAsync(HttpContext http, CancellationToken ct = default);
}