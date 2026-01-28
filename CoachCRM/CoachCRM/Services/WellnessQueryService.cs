using CoachCRM.Data;
using CoachCRM.Dtos;
using CoachCRM.Extensions;
using CoachCRM.Models;
using Microsoft.EntityFrameworkCore;

namespace CoachCRM.Services;

public class WellnessQueryService : IWellnessQueryService
{
    private readonly AppDbContext _db;

    public WellnessQueryService(AppDbContext db) => _db = db;

    public async Task<List<WellnessCheckDto>> GetTeamDayAsync(int teamId, DateOnly targetDate, CancellationToken ct = default)
    {
        var checks = await _db.WellnessChecks
            .AsNoTracking()
            .Include(w => w.Athlete)
            .ThenInclude(a => a.TeamMemberships)
            .Where(w => w.Date == targetDate && w.Athlete.TeamMemberships.Any(tm => tm.TeamId == teamId))
            .ToListAsync(ct);

        return checks.Select(w => w.ToDto()).ToList();
    }

    public async Task<object> GetTeamWellnessIndexFromLatestChecksAsync(int teamId, int take, CancellationToken ct = default)
    {
        // 1) csapat sportolói
        var athletes = await _db.TeamMemberships
            .AsNoTracking()
            .Where(tm => tm.TeamId == teamId)
            .Select(tm => new
            {
                tm.AthleteId,
                tm.Athlete.FirstName,
                tm.Athlete.LastName
            })
            .Distinct()
            .ToListAsync(ct);

        var athleteIds = athletes.Select(a => a.AthleteId).ToList();

        // 2) minden check ezekre
        var allChecks = await _db.WellnessChecks
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
            .ToListAsync(ct);

        var perAthleteAgg = allChecks
            .GroupBy(w => w.AthleteId)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var latest = g.Take(take).ToList();
                    var indices = latest.Select(WellnessIndexCalculator.CalculateIndex).ToList();
                    return new
                    {
                        Count = indices.Count,
                        Avg = indices.Count > 0 ? indices.Average() : (double?)null
                    };
                });

        return new
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
    }

    public async Task<List<TeamDailyWellnessIndexPointDto>> GetTeamWellnessIndexSeriesAsync(
        int teamId, 
        string? range, 
        DateOnly? from, 
        DateOnly? to, 
        bool includeEmptyDays,
        CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var (fromDate, toDate) = ResolveRange(today, range, from, to);

        var athleteIds = await _db.TeamMemberships
            .AsNoTracking()
            .Where(tm => tm.TeamId == teamId)
            .Select(tm => tm.AthleteId)
            .Distinct()
            .ToListAsync(ct);

        if (athleteIds.Count == 0)
            return new List<TeamDailyWellnessIndexPointDto>();

        var checks = await _db.WellnessChecks
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
            .ToListAsync(ct);

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

        if (!includeEmptyDays)
            return daily
                .OrderBy(x => x.Key)
                .Select(x => new TeamDailyWellnessIndexPointDto
                {
                    Date = x.Key.ToString("yyyy-MM-dd"),
                    AverageIndex = x.Value.Avg is null ? null : Math.Round(x.Value.Avg.Value, 2),
                    SampleSize = x.Value.SampleSize
                })
                .ToList();
        var result = new List<TeamDailyWellnessIndexPointDto>();
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
        return result;
    }

    public async Task<object> GetTeamRosterWellnessAsync(int teamId, int take, int windowDays, CancellationToken ct = default)
    {
        var roster = await _db.TeamMemberships
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
            .ToListAsync(ct);

        if (roster.Count == 0)
        {
            return new
            {
                TeamId = teamId,
                Take = take,
                WindowDays = windowDays,
                Athletes = new List<TeamRosterWellnessRowDto>()
            };
        }

        var athleteIds = roster.Select(r => r.AthleteId).ToList();

        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var fromCompliance = today.AddDays(-(windowDays - 1));

        var checks = await _db.WellnessChecks
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
            .ToListAsync(ct);

        var checksByAthlete = checks
            .GroupBy(w => w.AthleteId)
            .ToDictionary(g => g.Key, g => g.ToList());

        static string GetStatus(double? lastIndex, int complianceCount)
        {
            if (lastIndex == null || complianceCount == 0) return "NoData";
            if (lastIndex < 45) return "Critical";
            if (lastIndex < 60 || complianceCount < 4) return "Watch";
            return "OK";
        }

        var rows = roster.Select(r =>
        {
            checksByAthlete.TryGetValue(r.AthleteId, out var athleteChecks);
            athleteChecks ??= new List<WellnessCheck>();

            var last = athleteChecks.FirstOrDefault(); // már DESC
            double? lastIndex = last == null ? null : WellnessIndexCalculator.CalculateIndex(last);

            var latestN = athleteChecks.Take(take).ToList();
            var indicesN = latestN.Select(WellnessIndexCalculator.CalculateIndex).ToList();
            double? avgIndex = indicesN.Count > 0 ? indicesN.Average() : (double?)null;

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

        return new
        {
            TeamId = teamId,
            Take = take,
            WindowDays = windowDays,
            Athletes = rows
        };
    }

    public async Task<List<WellnessIndexPointDto>> GetWellnessIndexForAthleteAsync(int athleteId, DateOnly? from, DateOnly? to, CancellationToken ct = default)
    {
        var query = _db.WellnessChecks.AsNoTracking().Where(w => w.AthleteId == athleteId);

        if (from.HasValue) query = query.Where(w => w.Date >= from.Value);
        if (to.HasValue) query = query.Where(w => w.Date <= to.Value);

        var checks = await query.OrderBy(w => w.Date).ToListAsync(ct);

        return checks.Select(w => new WellnessIndexPointDto
        {
            Date = w.Date.ToString("yyyy-MM-dd"),
            Index = WellnessIndexCalculator.CalculateIndex(w)
        }).ToList();
    }

    public async Task<List<WellnessCheckDto>> GetAthleteWellnessAsync(int athleteId, int days, CancellationToken ct = default)
    {
        var fromDate = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(-days + 1));

        var checks = await _db.WellnessChecks
            .AsNoTracking()
            .Include(w => w.Athlete)
            .Where(w => w.AthleteId == athleteId && w.Date >= fromDate)
            .OrderByDescending(w => w.Date)
            .ToListAsync(ct);

        return checks.Select(w => w.ToDto()).ToList();
    }
    
    private static (DateOnly fromDate, DateOnly toDate) ResolveRange(DateOnly today, string? range, DateOnly? from, DateOnly? to)
    {
        if (from.HasValue && to.HasValue) return (from.Value, to.Value);

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

        return (today.AddDays(-(days - 1)), today);
    }
}