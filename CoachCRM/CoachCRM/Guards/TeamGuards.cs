using CoachCRM.Data;
using Microsoft.EntityFrameworkCore;

namespace CoachCRM.Guards;

public static class TeamGuards
{
    public static async Task<bool> CoachOwnsTeamAsync(
        this AppDbContext db,
        int coachId,
        int teamId,
        CancellationToken ct = default)
        => await db.Teams.AsNoTracking()
            .AnyAsync(t => t.Id == teamId && t.CoachId == coachId, ct);
}