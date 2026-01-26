using CoachCRM.Data;
using CoachCRM.Dtos;
using CoachCRM.Errors;
using CoachCRM.Extensions;
using CoachCRM.Guards;
using CoachCRM.Models;
using CoachCRM.Security;
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
    private readonly ICurrentUserContext _current;
    private readonly IAccessGuard _access;

    public WellnessChecksController(AppDbContext context, ICurrentUserContext current, IAccessGuard access)
    {
        _context = context;
        _current = current;
        _access = access;
    }

    // ════════════════════════════════════════════════
    // PLAYER – saját mai wellness check
    // ════════════════════════════════════════════════

    // GET: api/wellnesschecks/me/today
    [HttpGet("me/today")]
    public async Task<ActionResult<WellnessCheckDto?>> GetMyToday()
    {
        var athlete = await _access.RequireCurrentAthleteAsync();

        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);

        var entity = await _context.WellnessChecks
            .AsNoTracking()
            .Include(w => w.Athlete) // később kiváltjuk projectionnel
            .FirstOrDefaultAsync(w => w.AthleteId == athlete.Id && w.Date == today);

        return Ok(entity == null ? null : entity.ToDto());
    }

    // POST: api/wellnesschecks/me/today
    [HttpPost("me/today")]
    public async Task<ActionResult<WellnessCheckDto>> CreateMyToday([FromBody] CreateWellnessCheckDto dto)
    {
        var athlete = await _access.RequireCurrentAthleteAsync();
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);

        var alreadyExists = await _context.WellnessChecks
            .AnyAsync(w => w.AthleteId == athlete.Id && w.Date == today);

        if (alreadyExists)
            throw new ConflictAppException(ErrorCodes.WellnessAlreadyExists);

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
        var coachId = User.RequireCoachId();

        var ownsTeam = await _context.CoachOwnsTeamAsync(coachId, teamId);
        if (!ownsTeam)
            throw new ForbiddenAppException(ErrorCodes.TeamNotOwned);

        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow.Date);

        var checks = await _context.WellnessChecks
            .AsNoTracking()
            .Include(w => w.Athlete)
            .ThenInclude(a => a.TeamMemberships)
            .Where(w =>
                w.Date == targetDate &&
                w.Athlete.TeamMemberships.Any(tm => tm.TeamId == teamId))
            .ToListAsync();

        return Ok(checks.Select(w => w.ToDto()).ToList());
    }
    
    // GET: api/wellnesschecks/athletes/{athleteId}?days=7
    [HttpGet("athletes/{athleteId}")]
    public async Task<ActionResult<IEnumerable<WellnessCheckDto>>> GetAthleteWellness(
        int athleteId,
        [FromQuery] int days = 7)
    {
        var coach = await _access.RequireCoachAsync();
        await _access.RequireAthleteLinkedAsync(coach.Id, athleteId);

        var fromDate = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(-days + 1));

        var checks = await _context.WellnessChecks
            .AsNoTracking()
            .Include(w => w.Athlete) // később: projection
            .Where(w => w.AthleteId == athleteId && w.Date >= fromDate)
            .OrderByDescending(w => w.Date)
            .ToListAsync();

        return Ok(checks.Select(w => w.ToDto()).ToList());
    }
    
    [HttpGet("athletes/{athleteId}/wellness-index")]
    public async Task<ActionResult<List<WellnessIndexPointDto>>> GetWellnessIndexForAthlete(
        int athleteId,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to)
    {
        var userId = _current.UserId;

        var coach = await _context.Coaches
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (coach == null)
            throw new ForbiddenAppException(ErrorCodes.CoachNotFound);

        // csak olyan sportolót láthasson, aki az edzőhöz tartozik
        bool isLinked = await _context.CoachAthletes
            .AnyAsync(ca => ca.CoachId == coach.Id && ca.AthleteId == athleteId);

        if (!isLinked)
            throw new ForbiddenAppException(ErrorCodes.AthleteNotLinked);

        var query = _context.WellnessChecks
            .Where(w => w.AthleteId == athleteId);

        if (from.HasValue)
            query = query.Where(w => w.Date >= from.Value);

        if (to.HasValue)
            query = query.Where(w => w.Date <= to.Value);

        var checks = await query
            .OrderBy(w => w.Date)
            .ToListAsync();

        var result = checks
            .Select(w => new WellnessIndexPointDto
            {
                Date = w.Date.ToString("yyyy-MM-dd"),
                Index = WellnessIndexCalculator.CalculateIndex(w)
            })
            .ToList();

        return Ok(result);
    }
    
    // GET: api/wellnesschecks/teams/{teamId}/wellness-index/avg-latest?take=14
    [HttpGet("teams/{teamId}/wellness-index/avg-latest")]
    public async Task<ActionResult> GetTeamWellnessIndexAveragesFromLatestChecks(
        int teamId,
        [FromQuery] int take = 14)
    {
        var userId = _current.UserId;

        if (take < 1) take = 1;
        if (take > 14) take = 14; // max 14

        var coach = await _context.Coaches
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (coach == null)
            throw new ForbiddenAppException(ErrorCodes.CoachNotFound);

        var ownsTeam = await _context.Teams
            .AsNoTracking()
            .AnyAsync(t => t.Id == teamId && t.CoachId == coach.Id);

        if (!ownsTeam)
            throw new ForbiddenAppException(ErrorCodes.TeamNotOwned);

        // 1) csapat sportolói
        var athletes = await _context.TeamMemberships
            .AsNoTracking()
            .Where(tm => tm.TeamId == teamId)
            .Select(tm => new
            {
                tm.AthleteId,
                tm.Athlete.FirstName,
                tm.Athlete.LastName
            })
            .Distinct()
            .ToListAsync();

        var athleteIds = athletes.Select(a => a.AthleteId).ToList();

        // 2) minden check csak ezekre az athlete-ekre, DESC dátum szerint
        // csak a szükséges mezők
        var allChecks = await _context.WellnessChecks
            .AsNoTracking()
            .Where(w => athleteIds.Contains(w.AthleteId))
            .OrderByDescending(w => w.Date)
            .Select(w => new WellnessCheck
            {
                AthleteId = w.AthleteId,
                Date = w.Date,
                Fatigue = w.Fatigue,
                SleepQuality = w.SleepQuality,
                MuscleSoreness = w.MuscleSoreness,
                Stress = w.Stress,
                Mood = w.Mood
            })
            .ToListAsync();

        // 3) memóriában sportolónként: legutóbbi take db -> index -> átlag
        var perAthleteAgg = allChecks
            .GroupBy(w => w.AthleteId)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var latest = g.Take(take).ToList(); // ha kevesebb van, mindet viszi ✅
                    var indices = latest.Select(WellnessIndexCalculator.CalculateIndex).ToList();

                    return new
                    {
                        Count = indices.Count,
                        Avg = indices.Count > 0 ? indices.Average() : (double?)null
                    };
                });

        var result = new
        {
            TeamId = teamId,
            Take = take,
            Athletes = athletes.Select(a =>
            {
                perAthleteAgg.TryGetValue(a.AthleteId, out var agg);

                return new
                {
                    a.AthleteId,
                    a.FirstName,
                    a.LastName,
                    Samples = agg?.Count ?? 0,
                    AverageWellnessIndex = agg?.Avg is null ? (double?)null : Math.Round(agg.Avg.Value, 2)
                };
            }).ToList()
        };

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
        [FromQuery] bool includeEmptyDays = true)
    {
        var userId = _current.UserId;

        var coach = await _context.Coaches
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (coach == null)
            throw new ForbiddenAppException(ErrorCodes.CoachNotFound);

        // Csak a saját csapatát láthassa
        bool ownsTeam = await _context.Teams
            .AsNoTracking()
            .AnyAsync(t => t.Id == teamId && t.CoachId == coach.Id);

        if (!ownsTeam)
            throw new ForbiddenAppException(ErrorCodes.TeamNotOwned);

        // Intervallum meghatározás
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var (fromDate, toDate) = ResolveRange(today, range, from, to);

        // Csapat sportolói
        var athleteIds = await _context.TeamMemberships
            .AsNoTracking()
            .Where(tm => tm.TeamId == teamId)
            .Select(tm => tm.AthleteId)
            .Distinct()
            .ToListAsync();

        if (athleteIds.Count == 0)
            return Ok(new List<TeamDailyWellnessIndexPointDto>());

        // WellnessChecks az intervallumban
        // (EF nem fogja tudni SQL-ben kiszámolni az indexet, ezért memóriában számoljuk)
        var checks = await _context.WellnessChecks
            .AsNoTracking()
            .Where(w => athleteIds.Contains(w.AthleteId) && w.Date >= fromDate && w.Date <= toDate)
            .Select(w => new WellnessCheck
            {
                AthleteId = w.AthleteId,
                Date = w.Date,
                Fatigue = w.Fatigue,
                SleepQuality = w.SleepQuality,
                MuscleSoreness = w.MuscleSoreness,
                Stress = w.Stress,
                Mood = w.Mood
            })
            .ToListAsync();

        // Napi csoportosítás -> átlag index + mintaszám
        var daily = checks
            .GroupBy(w => w.Date)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var indices = g.Select(WellnessIndexCalculator.CalculateIndex).ToList();
                    return new
                    {
                        SampleSize = indices.Count,
                        Avg = indices.Count > 0 ? indices.Average() : (double?)null
                    };
                });

        var result = new List<TeamDailyWellnessIndexPointDto>();

        if (includeEmptyDays)
        {
            for (var d = fromDate; d <= toDate; d = d.AddDays(1))
            {
                if (daily.TryGetValue(d, out var entry))
                {
                    result.Add(new TeamDailyWellnessIndexPointDto
                    {
                        Date = d.ToString("yyyy-MM-dd"),
                        AverageIndex = entry.Avg is null ? null : Math.Round(entry.Avg.Value, 2),
                        SampleSize = entry.SampleSize
                    });
                }
                else
                {
                    result.Add(new TeamDailyWellnessIndexPointDto
                    {
                        Date = d.ToString("yyyy-MM-dd"),
                        AverageIndex = null,
                        SampleSize = 0
                    });
                }
            }
        }
        else
        {
            result = daily
                .OrderBy(x => x.Key)
                .Select(x => new TeamDailyWellnessIndexPointDto
                {
                    Date = x.Key.ToString("yyyy-MM-dd"),
                    AverageIndex = x.Value.Avg is null ? null : Math.Round(x.Value.Avg.Value, 2),
                    SampleSize = x.Value.SampleSize
                })
                .ToList();
        }

        return Ok(result);
    }

    private static (DateOnly fromDate, DateOnly toDate) ResolveRange(
        DateOnly today,
        string? range,
        DateOnly? from,
        DateOnly? to)
    {
        // Ha from/to meg van adva, azt használjuk
        if (from.HasValue && to.HasValue)
            return (from.Value, to.Value);

        range = (range ?? "14d").Trim().ToLowerInvariant();

        var days = range switch
        {
            "7d" or "1w" or "week" => 7,
            "14d" or "2w" => 14,
            "30d" or "1m" or "month" => 30,
            "180d" or "6m" or "halfyear" => 180,
            "365d" or "1y" or "year" => 365,
            _ => 14
        };

        // inclusive tartomány: today is benne van
        return (today.AddDays(-(days - 1)), today);
    }

    // GET: api/wellnesschecks/teams/{teamId}/roster-wellness?take=14&windowDays=7
    [HttpGet("teams/{teamId}/roster-wellness")]
    public async Task<ActionResult> GetTeamRosterWellness(
        int teamId,
        [FromQuery] int take = 14,
        [FromQuery] int windowDays = 7)
    {
        var userId = _current.UserId;

        if (take < 1) take = 1;
        if (take > 30) take = 30; // engedjük 30-ig, ha később kell
        if (windowDays < 1) windowDays = 1;
        if (windowDays > 30) windowDays = 30;

        var coach = await _context.Coaches
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (coach == null)
            throw new ForbiddenAppException(ErrorCodes.CoachNotFound);

        var ownsTeam = await _context.Teams
            .AsNoTracking()
            .AnyAsync(t => t.Id == teamId && t.CoachId == coach.Id);

        if (!ownsTeam)
            throw new ForbiddenAppException(ErrorCodes.TeamNotOwned);

        // 1) csapat sportolói (alap roster)
        var roster = await _context.TeamMemberships
            .AsNoTracking()
            .Where(tm => tm.TeamId == teamId)
            .Select(tm => new
            {
                AthleteId = tm.AthleteId,
                tm.Athlete.FirstName,
                tm.Athlete.LastName,
                HasUserAccount = tm.Athlete.UserId != null
            })
            .Distinct()
            .ToListAsync();

        if (roster.Count == 0)
        {
            return Ok(new
            {
                TeamId = teamId,
                Take = take,
                WindowDays = windowDays,
                Athletes = new List<TeamRosterWellnessRowDto>()
            });
        }

        var athleteIds = roster.Select(r => r.AthleteId).ToList();

        // 2) lekérjük az összes releváns wellness checket:
        // - kell a "last" és az "avg last N"
        // - kell a compliance window (utolsó X nap)
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var fromCompliance = today.AddDays(-(windowDays - 1));

        var checks = await _context.WellnessChecks
            .AsNoTracking()
            .Where(w => athleteIds.Contains(w.AthleteId))
            .OrderByDescending(w => w.Date)
            .Select(w => new WellnessCheck
            {
                AthleteId = w.AthleteId,
                Date = w.Date,
                Fatigue = w.Fatigue,
                SleepQuality = w.SleepQuality,
                MuscleSoreness = w.MuscleSoreness,
                Stress = w.Stress,
                Mood = w.Mood
            })
            .ToListAsync();

        // 3) sportolónként csoportosítva könnyű számolni memóriában
        var checksByAthlete = checks
            .GroupBy(w => w.AthleteId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // 4) státusz szabályok (egyszerű, később finomítható)
        static string GetStatus(double? lastIndex, int complianceCount)
        {
            if (lastIndex == null || complianceCount == 0)
                return "NoData";

            if (lastIndex < 45)
                return "Critical";

            if (lastIndex < 60 || complianceCount < 4)
                return "Watch";

            return "OK";
        }


        var resultRows = roster.Select(r =>
        {
            checksByAthlete.TryGetValue(r.AthleteId, out var athleteChecks);

            athleteChecks ??= new List<WellnessCheck>();

            // last
            var last = athleteChecks.OrderByDescending(x => x.Date).FirstOrDefault();
            double? lastIndex = last == null ? null : WellnessIndexCalculator.CalculateIndex(last);

            // avg last N
            var latestN = athleteChecks.Take(take).ToList(); // athleteChecks már DESC date szerint van
            var indicesN = latestN.Select(WellnessIndexCalculator.CalculateIndex).ToList();
            double? avgIndex = indicesN.Count > 0 ? indicesN.Average() : (double?)null;

            // compliance in last windowDays
            int complianceCount = athleteChecks.Count(x => x.Date >= fromCompliance && x.Date <= today);

            return new TeamRosterWellnessRowDto
            {
                AthleteId = r.AthleteId,
                FirstName = r.FirstName ?? "",
                LastName = r.LastName ?? "",
                HasUserAccount = r.HasUserAccount,

                AverageWellnessIndex = avgIndex == null ? null : Math.Round(avgIndex.Value, 2),
                LastWellnessDate = last?.Date.ToString("yyyy-MM-dd"),
                LastWellnessIndex = lastIndex == null ? null : Math.Round(lastIndex.Value, 2),

                ComplianceCount = complianceCount,
                ComplianceWindowDays = windowDays,

                Status = GetStatus(lastIndex, complianceCount)
            };
        }).ToList();

        return Ok(new
        {
            TeamId = teamId,
            Take = take,
            WindowDays = windowDays,
            Athletes = resultRows
        });
    }

}
