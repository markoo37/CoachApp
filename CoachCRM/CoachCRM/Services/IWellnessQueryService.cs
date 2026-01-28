using CoachCRM.Dtos;

namespace CoachCRM.Services;

public interface IWellnessQueryService
{
    Task<List<WellnessCheckDto>> GetTeamDayAsync(int teamId, DateOnly targetDate, CancellationToken ct = default);
    
    Task<object> GetTeamWellnessIndexFromLatestChecksAsync(int teamId, int take, CancellationToken ct = default);
    
    Task<List<TeamDailyWellnessIndexPointDto>> GetTeamWellnessIndexSeriesAsync(
        int teamId,
        string? range,
        DateOnly? from,
        DateOnly? to,
        bool includeEmptyDays,
        CancellationToken ct = default);

    Task<object> GetTeamRosterWellnessAsync(
        int teamId,
        int take,
        int windowDays,
        CancellationToken ct = default);

    // opcionális (ha ezeket is kiszerezzük)
    Task<List<WellnessIndexPointDto>> GetWellnessIndexForAthleteAsync(
        int athleteId, DateOnly? from, DateOnly? to, CancellationToken ct = default);

    Task<List<WellnessCheckDto>> GetAthleteWellnessAsync(
        int athleteId, int days, CancellationToken ct = default);
}