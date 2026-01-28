using CoachCRM.Data;
using CoachCRM.Dtos;
using CoachCRM.Errors;
using CoachCRM.Extensions;
using CoachCRM.Guards;
using CoachCRM.Models;
using CoachCRM.Services;
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
    private readonly IAccessGuard _access;
    private readonly IWellnessQueryService _wellnessQueryService;
    private readonly IPlayerWellnessService _playerWellnessService;

    public WellnessChecksController(AppDbContext context, IAccessGuard access, IWellnessQueryService wellnessQueryService, IPlayerWellnessService playerWellnessService)
    {
        _context = context;
        _access = access;
        _wellnessQueryService = wellnessQueryService;
        _playerWellnessService = playerWellnessService;
    }

    // ════════════════════════════════════════════════
    // PLAYER – saját mai wellness check
    // ════════════════════════════════════════════════

    // GET: api/wellnesschecks/me/today
    [HttpGet("me/today")]
    public async Task<ActionResult<WellnessCheckDto?>> GetMyToday(CancellationToken ct)
    {
        return Ok(await _playerWellnessService.GetMyTodayAsync(ct));
    }

    // POST: api/wellnesschecks/me/today
    [HttpPost("me/today")]
    public async Task<ActionResult<WellnessCheckDto>> CreateMyToday([FromBody] CreateWellnessCheckDto dto, CancellationToken ct)
    {
        return Ok(await _playerWellnessService.CreateMyTodayAsync(dto, ct));
    }

    // ════════════════════════════════════════════════
    // COACH – csapat napi wellness-e
    // ════════════════════════════════════════════════

    // GET: api/wellnesschecks/teams/{teamId}/day?date=2025-12-01
    [HttpGet("teams/{teamId}/day")]
    public async Task<ActionResult<IEnumerable<WellnessCheckDto>>> GetTeamDay(
        int teamId,
        [FromQuery] DateOnly? date,
        CancellationToken ct)
    {
        var coach = await _access.RequireCoachAsync(ct);
        await _access.RequireTeamOwnedAsync(coach.Id, teamId, ct);

        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow.Date);

        var result = await _wellnessQueryService.GetTeamDayAsync(teamId, targetDate, ct);

        return Ok(result);
    }
    
    // GET: api/wellnesschecks/athletes/{athleteId}?days=7
    [HttpGet("athletes/{athleteId}")]
    public async Task<ActionResult<IEnumerable<WellnessCheckDto>>> GetAthleteWellness(
        int athleteId,
        [FromQuery] int days = 7,
        CancellationToken ct = default)
    {
        var coach = await _access.RequireCoachAsync(ct);
        await _access.RequireAthleteLinkedAsync(coach.Id, athleteId, ct);
        
        var result = await _wellnessQueryService.GetAthleteWellnessAsync(athleteId, days, ct);
        
        return Ok(result);
    }
    
    [HttpGet("athletes/{athleteId}/wellness-index")]
    public async Task<ActionResult<List<WellnessIndexPointDto>>> GetWellnessIndexForAthlete(
        int athleteId,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken ct = default)
    {
        var coach = await _access.RequireCoachAsync(ct);
        await _access.RequireAthleteLinkedAsync(coach.Id, athleteId, ct);

        var result = await _wellnessQueryService.GetWellnessIndexForAthleteAsync(athleteId, from, to, ct);

        return Ok(result);
    }
    
    // GET: api/wellnesschecks/teams/{teamId}/wellness-index/avg-latest?take=14
    [HttpGet("teams/{teamId}/wellness-index/avg-latest")]
    public async Task<ActionResult> GetTeamWellnessIndexAveragesFromLatestChecks(
        int teamId,
        [FromQuery] int take = 14,
        CancellationToken ct = default)
    {
        if (take < 1) take = 1;
        if (take > 14) take = 14; // max 14

        var coach = await _access.RequireCoachAsync(ct);
        await _access.RequireTeamOwnedAsync(coach.Id, teamId, ct);

        var result = await _wellnessQueryService.GetTeamWellnessIndexFromLatestChecksAsync(teamId, take, ct);
        return Ok(result);
    }
    
    // GET: api/wellnesschecks/teams/{teamId}/wellness-index/series?range=30d
    // opcionálisan: ?from=2025-01-01&to=2025-12-31
    // opcionálisan: ?includeEmptyDays=true
    [HttpGet("teams/{teamId}/wellness-index/series")]
    public async Task<ActionResult<List<TeamDailyWellnessIndexPointDto>>> GetTeamWellnessIndexSeries(
        int teamId,
        [FromQuery] string? range,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] bool includeEmptyDays = true,
        CancellationToken ct = default)
    {
        var coach = await _access.RequireCoachAsync(ct);
        await _access.RequireTeamOwnedAsync(coach.Id, teamId, ct);

        var result =
            await _wellnessQueryService.GetTeamWellnessIndexSeriesAsync(teamId, range, from, to, includeEmptyDays, ct);

        return Ok(result);
    }

    // GET: api/wellnesschecks/teams/{teamId}/roster-wellness?take=14&windowDays=7
    [HttpGet("teams/{teamId}/roster-wellness")]
    public async Task<ActionResult> GetTeamRosterWellness(
        int teamId,
        [FromQuery] int take = 14,
        [FromQuery] int windowDays = 7,
        CancellationToken ct = default)
    {
        if (take < 1) take = 1;
        if (take > 30) take = 30; // engedjük 30-ig, ha később kell
        if (windowDays < 1) windowDays = 1;
        if (windowDays > 30) windowDays = 30;

        var coach = await _access.RequireCoachAsync(ct);
        await _access.RequireTeamOwnedAsync(coach.Id, teamId, ct);

        var result = await _wellnessQueryService.GetTeamRosterWellnessAsync(teamId, take, windowDays, ct);
        return Ok(result);
    }

}
