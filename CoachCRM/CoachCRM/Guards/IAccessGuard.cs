using CoachCRM.Models;

namespace CoachCRM.Guards;

public interface IAccessGuard
{
    Task<Athlete> RequireCurrentAthleteAsync(CancellationToken ct = default);
    Task<Coach> RequireCoachAsync(CancellationToken ct = default);

    Task RequireTeamOwnedAsync(int coachId, int teamId, CancellationToken ct = default);
    Task RequireAthleteLinkedAsync(int coachId, int athleteId, CancellationToken ct = default);
}