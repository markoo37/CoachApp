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
using CoachCRM.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Logging;

namespace CoachCRM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly ILogger<AuthController> _logger;
        private readonly IAuthService _authService;

        public AuthController(AppDbContext context, IConfiguration config, ILogger<AuthController> logger, IAuthService authService)
        {
            _context = context;
            _config = config;
            _logger = logger;
            _authService = authService;
        }

        // COACH REGISTRATION
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto, CancellationToken ct = default)
        {
            await _authService.RegisterCoachAsync(dto, ct);

            return NoContent();
        }
        
        [AllowAnonymous]
        [HttpPost("check-email")]
        public async Task<IActionResult> CheckEmail(CheckEmailDto dto, CancellationToken ct = default)
        {
            var (exists, hasAccount) = await _authService.CheckEmailAsync(dto, ct);
            return Ok(new { exists, hasAccount });
        }

        // PLAYER REGISTRATION
        [AllowAnonymous]
        [HttpPost("register-player")]
        public async Task<IActionResult> RegisterPlayer(RegisterPlayerDto dto, CancellationToken ct = default)
        {
            await _authService.RegisterPlayerAsync(dto, ct);
            return NoContent();
        }

        // COACH LOGIN
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto, CancellationToken ct = default)
        {
            var token = await _authService.LoginCoachAsync(dto, HttpContext, ct);

            return Ok(new { token });
        }


        // PLAYER LOGIN
        [AllowAnonymous]
        [HttpPost("login-player")]
        public async Task<IActionResult> LoginPlayer(LoginDto dto, CancellationToken ct = default)
        {
            var result = await _authService.LoginPlayerAsync(dto, HttpContext, ct);
            return Ok(new { token = result.Token, player = result.Player });
        }

        // REFRESH TOKEN
        [AllowAnonymous]
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh(CancellationToken ct = default)
        {
            var token = await _authService.RefreshAsync(HttpContext, ct);
            return Ok(new { token });
        }

        // LOGOUT
        [AllowAnonymous]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout(CancellationToken ct = default)
        {
            await _authService.LogoutAsync(HttpContext, ct);
            return NoContent();
        }
    }
}
