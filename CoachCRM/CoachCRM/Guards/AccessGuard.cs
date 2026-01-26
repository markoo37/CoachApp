using CoachCRM.Models;
using CoachCRM.Data;
using CoachCRM.Errors;
using CoachCRM.Security;
using Microsoft.EntityFrameworkCore;

namespace CoachCRM.Guards;

public sealed class AccessGuard : IAccessGuard
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserContext _current;

    public AccessGuard(AppDbContext db, ICurrentUserContext current)
    {
        _db = db;
        _current = current;
    }
    
    // PLAYER: a saját athlete profilja kötelező (különben 404)
    public async Task<Athlete> RequireCurrentAthleteAsync(CancellationToken ct = default)
    {
        var userId = _current.UserId;

        var athlete = await _db.PlayerUsers
            .AsNoTracking()
            .Where(pu => pu.Id == userId)         // ha nálad nem Id, hanem UserId, itt igazítsd
            .Select(pu => pu.Athlete)
            .FirstOrDefaultAsync(ct);

        if (athlete == null)
            throw new NotFoundAppException(ErrorCodes.PlayerProfileNotFound);

        return athlete;
    }

    // COACH: ha nincs coach profil, az jogosultság (403)
    public async Task<Coach> RequireCoachAsync(CancellationToken ct = default)
    {
        var userId = _current.UserId;

        var coach = await _db.Coaches
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.UserId == userId, ct);

        if (coach == null)
            throw new ForbiddenAppException(ErrorCodes.CoachNotFound);

        return coach;
    }

    public async Task RequireTeamOwnedAsync(int coachId, int teamId, CancellationToken ct = default)
    {
        // Ha már van _context.CoachOwnsTeamAsync, használhatod azt is.
        var owns = await _db.Teams
            .AsNoTracking()
            .AnyAsync(t => t.Id == teamId && t.CoachId == coachId, ct);

        if (!owns)
            throw new ForbiddenAppException(ErrorCodes.TeamNotOwned);
    }

    public async Task RequireAthleteLinkedAsync(int coachId, int athleteId, CancellationToken ct = default)
    {
        var linked = await _db.CoachAthletes
            .AsNoTracking()
            .AnyAsync(ca => ca.CoachId == coachId && ca.AthleteId == athleteId, ct);

        if (!linked)
            throw new ForbiddenAppException(ErrorCodes.AthleteNotLinked);
    }
}