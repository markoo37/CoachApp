using CoachCRM.Data;
using CoachCRM.Dtos;
using CoachCRM.Guards;
using CoachCRM.Errors;
using CoachCRM.Extensions;
using CoachCRM.Models;
using Microsoft.EntityFrameworkCore;

namespace CoachCRM.Services;

public class PlayerWellnessService : IPlayerWellnessService
{
    private readonly AppDbContext _db;
    private readonly IAccessGuard _access;

    public PlayerWellnessService(AppDbContext context, IAccessGuard access)
    {
        _db = context;
        _access = access;
    }
    
    public async Task<WellnessCheckDto?> GetMyTodayAsync(CancellationToken ct = default)
    {
        var athlete = await _access.RequireCurrentAthleteAsync(ct);
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);

        var entity = await _db.WellnessChecks
            .AsNoTracking()
            .Include(w => w.Athlete)
            .FirstOrDefaultAsync(w => w.AthleteId == athlete.Id && w.Date == today, ct);

        return entity?.ToDto();
    }

    public async Task<WellnessCheckDto> CreateMyTodayAsync(CreateWellnessCheckDto dto, CancellationToken ct)
    {
        var athlete = await _access.RequireCurrentAthleteAsync(ct);
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);

        var alreadyExists = await _db.WellnessChecks
            .AnyAsync(w => w.AthleteId == athlete.Id && w.Date == today, ct);

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

        _db.WellnessChecks.Add(entity);
        await _db.SaveChangesAsync(ct);

        entity.Athlete = athlete;
        return entity.ToDto();
    }
}