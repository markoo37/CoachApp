using CoachCRM.Dtos;

namespace CoachCRM.Services;

public interface IPlayerWellnessService
{
    Task<WellnessCheckDto?> GetMyTodayAsync(CancellationToken ct = default);
    Task<WellnessCheckDto> CreateMyTodayAsync(CreateWellnessCheckDto dto, CancellationToken ct);
}