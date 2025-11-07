using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoachCRM.Data;
using CoachCRM.Models;
using CoachCRM.Dtos;
using CoachCRM.Extensions;
using Microsoft.AspNetCore.Authorization;

namespace CoachCRM.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TeamsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TeamsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/teams/my-teams
        [HttpGet("my-teams")]
        public async Task<IActionResult> GetMyTeams()
        {
            int userId = User.GetUserId();
            var coach = await _context.Coaches
                .FirstOrDefaultAsync(c => c.UserId == userId);
            if (coach == null)
                return Unauthorized();

            // Include TeamMemberships instead of Athletes, de kiszűrjük a "_Unassigned" csapatot
            var teams = await _context.Teams
                .Where(t => t.CoachId == coach.Id && t.Name != "_Unassigned")
                .Include(t => t.TeamMemberships)
                    .ThenInclude(tm => tm.Athlete)
                        .ThenInclude(a => a.User)
                .ToListAsync();

            var result = teams.Select(t => new
            {
                t.Id,
                t.Name,
                Athletes = t.TeamMemberships.Select(tm => new
                {
                    tm.Athlete.Id,
                    tm.Athlete.FirstName,
                    tm.Athlete.LastName,
                    tm.Athlete.BirthDate,
                    tm.Athlete.Weight,
                    tm.Athlete.Height,
                    tm.Athlete.Email,
                    HasUserAccount = tm.Athlete.User != null
                })
            });

            return Ok(result);
        }

        // GET: api/teams
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TeamDto>>> GetTeams()
        {
            int userId = User.GetUserId();
            var coachId = await _context.Coaches
                .Where(c => c.UserId == userId)
                .Select(c => c.Id)
                .FirstOrDefaultAsync();

            var teams = await _context.Teams
                .Where(t => t.CoachId == coachId && t.Name != "_Unassigned")
                .ToListAsync();

            var dtoList = teams.Select(t => t.ToDto()).ToList();
            return Ok(dtoList);
        }

        // POST: api/teams
        [HttpPost]
        public async Task<ActionResult<TeamDto>> PostTeam(CreateTeamDto dto)
        {
            int userId = User.GetUserId();
            var coach = await _context.Coaches
                .FirstOrDefaultAsync(c => c.UserId == userId);
            if (coach == null)
                return BadRequest("Coach not found.");

            var team = new Team
            {
                Name = dto.Name,
                CoachId = coach.Id
            };
            _context.Teams.Add(team);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTeams), new { id = team.Id }, team.ToDto());
        }

        // DELETE: api/teams/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTeam(int id)
        {
            int userId = User.GetUserId();
            var team = await _context.Teams
                .Include(t => t.Coach)
                .Include(t => t.TeamMemberships)
                .FirstOrDefaultAsync(t => t.Id == id && t.Coach.UserId == userId);
            if (team == null)
                return NotFound();

            // Nem engedjük a "_Unassigned" csapat törlését
            if (team.Name == "_Unassigned")
                return BadRequest("Cannot delete the unassigned team.");

            _context.Teams.Remove(team);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}