using CoachCRM.Data;
using CoachCRM.Dtos;
using CoachCRM.Extensions;
using CoachCRM.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CoachCRM.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WellnessChecksController : ControllerBase
{
    private readonly AppDbContext _context;

    public WellnessChecksController(AppDbContext context)
    {
        _context = context;
    }

    // ════════════════════════════════════════════════
    // PLAYER – saját mai wellness check
    // ════════════════════════════════════════════════

    // GET: api/wellnesschecks/me/today
    [HttpGet("me/today")]
    public async Task<ActionResult<WellnessCheckDto?>> GetMyToday()
    {
        int userId = User.GetUserId();

        var playerUser = await _context.PlayerUsers
            .Include(pu => pu.Athlete)
            .FirstOrDefaultAsync(pu => pu.Id == userId);

        if (playerUser?.Athlete == null)
            return NotFound("Player profile not found.");

        var athlete = playerUser.Athlete;
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);

        var entity = await _context.WellnessChecks
            .Include(w => w.Athlete)
            .FirstOrDefaultAsync(w =>
                w.AthleteId == athlete.Id &&
                w.Date == today);

        if (entity == null)
            return Ok(null); // még nem töltötte ki

        return Ok(entity.ToDto());
    }

    // POST: api/wellnesschecks/me/today
    [HttpPost("me/today")]
    public async Task<ActionResult<WellnessCheckDto>> CreateMyToday([FromBody] CreateWellnessCheckDto dto)
    {
        int userId = User.GetUserId();

        var playerUser = await _context.PlayerUsers
            .Include(pu => pu.Athlete)
            .FirstOrDefaultAsync(pu => pu.Id == userId);

        if (playerUser?.Athlete == null)
            return NotFound("Player profile not found.");

        var athlete = playerUser.Athlete;
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);

        bool alreadyExists = await _context.WellnessChecks
            .AnyAsync(w => w.AthleteId == athlete.Id && w.Date == today);

        if (alreadyExists)
            return Conflict(new { message = "A mai napra már kitöltötted a wellness checket." });

        var entity = new WellnessCheck
        {
            AthleteId = athlete.Id,
            Date = today,
            Fatigue = dto.Fatigue,
            SleepQuality = dto.SleepQuality,
            MuscleSoreness = dto.MuscleSoreness,
            Stress = dto.Stress,
            Mood = dto.Mood,
            Comment = dto.Comment,
            CreatedAt = DateTime.UtcNow
        };

        _context.WellnessChecks.Add(entity);
        await _context.SaveChangesAsync();

        // hogy működjön a ToDto, kell az Athlete navigation (vagy beállítjuk kézzel)
        entity.Athlete = athlete;

        return Ok(entity.ToDto());
    }

    // ════════════════════════════════════════════════
    // COACH – csapat napi wellness-e
    // ════════════════════════════════════════════════

    // GET: api/wellnesschecks/teams/{teamId}/day?date=2025-12-01
    [HttpGet("teams/{teamId}/day")]
    public async Task<ActionResult<IEnumerable<WellnessCheckDto>>> GetTeamDay(
        int teamId,
        [FromQuery] DateOnly? date)
    {
        int userId = User.GetUserId();

        var coach = await _context.Coaches
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (coach == null)
            return Unauthorized("Coach not found.");

        // Csak a saját csapatát láthassa
        var team = await _context.Teams
            .FirstOrDefaultAsync(t => t.Id == teamId && t.CoachId == coach.Id);

        if (team == null)
            return Forbid("This team does not belong to the current coach.");

        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow.Date);

        var checks = await _context.WellnessChecks
            .Include(w => w.Athlete)
                .ThenInclude(a => a.TeamMemberships)
            .Where(w =>
                w.Date == targetDate &&
                w.Athlete.TeamMemberships.Any(tm => tm.TeamId == teamId))
            .ToListAsync();

        var dtoList = checks
            .Select(w => w.ToDto())
            .ToList();

        return Ok(dtoList);
    }
    
    // GET: api/wellnesschecks/athletes/{athleteId}?days=7
    [HttpGet("athletes/{athleteId}")]
    public async Task<ActionResult<IEnumerable<WellnessCheckDto>>> GetAthleteWellness(
        int athleteId,
        [FromQuery] int days = 7)
    {
        int userId = User.GetUserId();

        var coach = await _context.Coaches
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (coach == null)
            return Unauthorized("Coach not found.");

        // csak olyan sportolót láthasson, aki hozzá tartozik
        var isLinked = await _context.CoachAthletes
            .AnyAsync(ca => ca.CoachId == coach.Id && ca.AthleteId == athleteId);

        if (!isLinked)
            return Forbid("This athlete is not linked to the current coach.");

        var fromDate = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(-days + 1));

        var checks = await _context.WellnessChecks
            .Include(w => w.Athlete)
            .Where(w => w.AthleteId == athleteId && w.Date >= fromDate)
            .OrderByDescending(w => w.Date)
            .ToListAsync();

        var dtoList = checks
            .Select(w => w.ToDto())
            .ToList();

        return Ok(dtoList);
    }
}
