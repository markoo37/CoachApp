using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoachCRM.Data;
using CoachCRM.Models;
using CoachCRM.Extensions;
using CoachCRM.Dtos;
using Microsoft.AspNetCore.Authorization;

namespace CoachCRM.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TrainingPlansController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TrainingPlansController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/trainingplans
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TrainingPlanDto>>> GetTrainingPlans()
        {
            int userId = User.GetUserId();

            var plans = await _context.TrainingPlans
                .Include(tp => tp.Team)
                .Include(tp => tp.Athlete)
                    .ThenInclude(a => a.TeamMemberships)
                        .ThenInclude(tm => tm.Team)
                            .ThenInclude(t => t.Coach)
                .Where(tp => 
                    // Plans assigned to a team that the coach owns
                    (tp.Team != null && tp.Team.Coach.UserId == userId)
                    // OR plans assigned to an athlete in a coach's team
                    || (tp.Athlete != null && tp.Athlete.TeamMemberships
                        .Any(tm => tm.Team.Coach.UserId == userId))
                )
                .ToListAsync();

            var dtoList = plans.Select(tp => tp.ToDto()).ToList();
            return Ok(dtoList);
        }

        // GET: api/trainingplans/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<TrainingPlanDto>> GetTrainingPlan(int id)
        {
            int userId = User.GetUserId();

            var plan = await _context.TrainingPlans
                .Include(tp => tp.Team)
                .Include(tp => tp.Athlete)
                    .ThenInclude(a => a.TeamMemberships)
                        .ThenInclude(tm => tm.Team)
                            .ThenInclude(t => t.Coach)
                .FirstOrDefaultAsync(tp => tp.Id == id && (
                    (tp.Team != null && tp.Team.Coach.UserId == userId)
                    || (tp.Athlete != null && tp.Athlete.TeamMemberships
                        .Any(tm => tm.Team.Coach.UserId == userId))));

            if (plan == null)
                return NotFound();

            return Ok(plan.ToDto());
        }

        // POST: api/trainingplans
        [HttpPost]
        public async Task<ActionResult<TrainingPlanDto>> PostTrainingPlan(CreateTrainingPlanDto dto)
        {
            int userId = User.GetUserId();

            TrainingPlan plan;

            // Assign to team
            if (dto.TeamId.HasValue)
            {
                var team = await _context.Teams
                    .Include(t => t.Coach)
                    .FirstOrDefaultAsync(t => t.Id == dto.TeamId && t.Coach.UserId == userId);

                if (team == null)
                    return BadRequest("Invalid team for current user.");

                plan = new TrainingPlan
                {
                    Name        = dto.Name,
                    Description = dto.Description,
                    Date        = dto.Date,
                    StartTime = dto.StartTime,
                    EndTime    = dto.EndTime,
                    TeamId      = team.Id,
                    AthleteId   = null
                };
            }
            // Assign to athlete
            else if (dto.AthleteId.HasValue)
            {
                var athlete = await _context.Athletes
                    .Include(a => a.TeamMemberships)
                        .ThenInclude(tm => tm.Team)
                            .ThenInclude(t => t.Coach)
                    .FirstOrDefaultAsync(a => a.Id == dto.AthleteId && 
                        a.TeamMemberships.Any(tm => tm.Team.Coach.UserId == userId));

                if (athlete == null)
                    return BadRequest("Invalid athlete for current user.");

                plan = new TrainingPlan
                {
                    Name        = dto.Name,
                    Description = dto.Description,
                    Date        = dto.Date,
                    StartTime = dto.StartTime,
                    EndTime    = dto.EndTime,
                    AthleteId   = athlete.Id,
                    TeamId      = null
                };
            }
            else
            {
                return BadRequest("Must specify either AthleteId or TeamId.");
            }

            _context.TrainingPlans.Add(plan);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTrainingPlan), new { id = plan.Id }, plan.ToDto());
        }

        // PUT: api/trainingplans/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTrainingPlan(int id, CreateTrainingPlanDto dto)
        {
            int userId = User.GetUserId();

            var plan = await _context.TrainingPlans
                .Include(tp => tp.Team)
                .Include(tp => tp.Athlete)
                    .ThenInclude(a => a.TeamMemberships)
                        .ThenInclude(tm => tm.Team)
                            .ThenInclude(t => t.Coach)
                .FirstOrDefaultAsync(tp => tp.Id == id && (
                    (tp.Team != null && tp.Team.Coach.UserId == userId)
                    || (tp.Athlete != null && tp.Athlete.TeamMemberships
                        .Any(tm => tm.Team.Coach.UserId == userId))));

            if (plan == null)
                return NotFound();

            plan.Name        = dto.Name;
            plan.Description = dto.Description;
            plan.Date        = dto.Date;
            plan.StartTime = dto.StartTime;
            plan.EndTime    = dto.EndTime;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/trainingplans/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTrainingPlan(int id)
        {
            int userId = User.GetUserId();

            var plan = await _context.TrainingPlans
                .Include(tp => tp.Team)
                .Include(tp => tp.Athlete)
                    .ThenInclude(a => a.TeamMemberships)
                        .ThenInclude(tm => tm.Team)
                            .ThenInclude(t => t.Coach)
                .FirstOrDefaultAsync(tp => tp.Id == id && (
                    (tp.Team != null && tp.Team.Coach.UserId == userId)
                    || (tp.Athlete != null && tp.Athlete.TeamMemberships
                        .Any(tm => tm.Team.Coach.UserId == userId))));

            if (plan == null)
                return NotFound();

            _context.TrainingPlans.Remove(plan);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
