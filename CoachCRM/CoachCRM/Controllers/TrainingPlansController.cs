using System.Runtime.InteropServices.JavaScript;
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
            if (IsInvalidTimeRange(dto, out var error))
            {
                return BadRequest(error);
            }
            
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
            if (IsInvalidTimeRange(dto, out var error))
            {
                return BadRequest(error);
            }
            
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
        
        // GET: api/trainingplans/range?from={from_date}&to={to_date}
        [HttpGet("range")]
        public async Task<ActionResult<IEnumerable<TrainingPlanDto>>> GetTrainingPlansInRange([FromQuery] DateOnly from, [FromQuery] DateOnly to)
        {
            int userId = User.GetUserId();

            var plans = await _context.TrainingPlans
                .Include(plan => plan.Team)
                .Include(plan => plan.Athlete)
                .ThenInclude(athlete => athlete.TeamMemberships)
                .ThenInclude(teammembership => teammembership.Team)
                .ThenInclude(team => team.Coach)
                .Where(plan => plan.Date >= from && plan.Date <= to && (
                    (plan.Team != null && plan.Team.Coach.UserId == userId) ||
                    (plan.Athlete != null && plan.Athlete.TeamMemberships.Any(membership => membership.Team.Coach.UserId == userId))
                )).ToListAsync();
            
            return Ok(plans.Select(plan => plan.ToDto()).ToList());
        } 
        
        private static bool IsInvalidTimeRange(CreateTrainingPlanDto dto, out string error)
        {
            var start = dto.Date.ToDateTime(dto.StartTime);
            var end   = dto.Date.ToDateTime(dto.EndTime);

            DateOnly now = new DateOnly(DateTime.Now.Year, DateTime.Now.Month, DateTime.Now.Day);
            if (dto.Date < now)
            {
                error = "Az új esemény dátuma nem lehet múltbéli dátum!";
                return true;
            }
            
            if (end <= start)
            {
                error = "Az esemény kezdete előbb kell hogy legyen, mint a végének!";
                return true;
            }

            if ((end - start).TotalMinutes < 10)
            {
                error = "Az edzésnek minimum 10 perc hosszúnak kell lennie";
                return true;
            }

            error = "";
            return false;
        }
    }
}
