using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoachCRM.Models;
using CoachCRM.Data;
using CoachCRM.Extensions;
using CoachCRM.Dtos;
using Microsoft.AspNetCore.Authorization;

namespace CoachCRM.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AthletesController : ControllerBase
{
    private readonly AppDbContext _context;

    public AthletesController(AppDbContext context)
    {
        _context = context;
    }

    // ════════════════════════════════════════════════
    // COACH ENDPOINTS (új architektúrához igazítva)
    // ════════════════════════════════════════════════

    // GET: api/athletes
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AthleteDto>>> GetAthletes()
    {
        int userId = User.GetUserId();
        var coach = await _context.Coaches.FirstOrDefaultAsync(c => c.UserId == userId);
        if (coach == null) return Unauthorized();

        var userEmails = await _context.Users.Select(u => u.Email).ToListAsync();

        var athleteIds = await _context.CoachAthletes
            .Where(ca => ca.CoachId == coach.Id)
            .Select(ca => ca.AthleteId)
            .ToListAsync();

        var athletes = await _context.Athletes
            .Where(a => athleteIds.Contains(a.Id))
            .Include(a => a.TeamMemberships)
            .ToListAsync();

        var dtoList = athletes.Select(a => new AthleteDto
        {
            Id = a.Id,
            FirstName = a.FirstName,
            LastName = a.LastName,
            BirthDate = a.BirthDate,
            Weight = a.Weight,
            Height = a.Height,
            Email = a.Email,
            HasUserAccount = !string.IsNullOrEmpty(a.Email) && userEmails.Contains(a.Email),
            TeamIds = a.TeamMemberships.Select(tm => tm.TeamId).ToList()
        }).ToList();

        return Ok(dtoList);
    }

    // POST: api/athletes/add-by-email
    [HttpPost("add-by-email")]
    public async Task<IActionResult> AddAthleteByEmail([FromBody] CreateAthleteByEmailDto dto)
    {
        int userId = User.GetUserId();
        var coach = await _context.Coaches.FirstOrDefaultAsync(c => c.UserId == userId);
        if (coach == null) return Unauthorized();

        var athlete = await _context.Athletes.FirstOrDefaultAsync(a => a.Email == dto.Email);

        if (athlete == null)
        {
            athlete = new Athlete { Email = dto.Email };
            _context.Athletes.Add(athlete);
            await _context.SaveChangesAsync();
        }

        var alreadyConnected = await _context.CoachAthletes
            .AnyAsync(ca => ca.CoachId == coach.Id && ca.AthleteId == athlete.Id);

        if (alreadyConnected)
            return BadRequest("Ez a játékos már hozzá van adva ehhez az edzőhöz!");

        _context.CoachAthletes.Add(new CoachAthlete
        {
            CoachId = coach.Id,
            AthleteId = athlete.Id
        });
        await _context.SaveChangesAsync();

        return Ok(athlete.Id);
    }

    // DELETE: api/athletes/remove-from-coach/{athleteId}
    [HttpDelete("remove-from-coach/{athleteId}")]
    public async Task<IActionResult> RemoveAthleteFromCoach(int athleteId)
    {
        int userId = User.GetUserId();
        var coach = await _context.Coaches.FirstOrDefaultAsync(c => c.UserId == userId);
        if (coach == null) return Unauthorized();

        var relation = await _context.CoachAthletes
            .FirstOrDefaultAsync(ca => ca.CoachId == coach.Id && ca.AthleteId == athleteId);

        if (relation == null)
            return NotFound("Ez a kapcsolat nem létezik!");

        _context.CoachAthletes.Remove(relation);
        await _context.SaveChangesAsync();
        return Ok();
    }

    // GET: api/athletes/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<AthleteDto>> GetAthlete(int id)
    {
        var a = await _context.Athletes
            .Include(x => x.TeamMemberships)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (a == null)
            return NotFound();

        var userEmails = await _context.Users.Select(u => u.Email).ToListAsync();

        var dto = new AthleteDto
        {
            Id = a.Id,
            FirstName = a.FirstName,
            LastName = a.LastName,
            BirthDate = a.BirthDate,
            Weight = a.Weight,
            Height = a.Height,
            Email = a.Email,
            HasUserAccount = !string.IsNullOrEmpty(a.Email) && userEmails.Contains(a.Email),
            TeamIds = a.TeamMemberships.Select(tm => tm.TeamId).ToList()
        };

        return Ok(dto);
    }

    // ════════════════════════════════════════════════
    // PLAYER ENDPOINTS (meglévő működés szerint)
    // ════════════════════════════════════════════════

    // GET: api/athletes/my-profile
    [HttpGet("my-profile")]
    public async Task<ActionResult<PlayerProfileDto>> GetMyProfile()
    {
        int userId = User.GetUserId();

        var playerUser = await _context.PlayerUsers
            .Include(pu => pu.Athlete)
                .ThenInclude(a => a.TeamMemberships)
                    .ThenInclude(tm => tm.Team)
                        .ThenInclude(t => t.Coach)
            .FirstOrDefaultAsync(pu => pu.AthleteId == userId);

        if (playerUser?.Athlete == null)
            return NotFound("Player profile not found.");

        var athlete = playerUser.Athlete;

        int? age = null;
        if (athlete.BirthDate.HasValue)
        {
            age = DateTime.Today.Year - athlete.BirthDate.Value.Year;
            if (athlete.BirthDate.Value.Date > DateTime.Today.AddYears(-age.Value))
                age--;
        }

        var teams = athlete.TeamMemberships.Select(tm => new TeamInfoDto
        {
            Id = tm.Team.Id,
            Name = tm.Team.Name,
            Coach = new CoachInfoDto
            {
                Id = tm.Team.Coach.Id,
                FirstName = tm.Team.Coach.FirstName,
                LastName = tm.Team.Coach.LastName,
                Email = tm.Team.Coach.Email
            },
            PlayerCount = tm.Team.TeamMemberships.Count
        }).ToList();

        var profile = new PlayerProfileDto
        {
            Id = athlete.Id,
            FirstName = athlete.FirstName,
            LastName = athlete.LastName,
            Email = athlete.Email,
            BirthDate = athlete.BirthDate,
            Weight = athlete.Weight,
            Height = athlete.Height,
            Age = age,
            Teams = teams,
            HasUserAccount = true
        };

        return Ok(profile);
    }

    // GET: api/athletes/my-teams
    [HttpGet("my-teams")]
    public async Task<ActionResult<IEnumerable<TeamInfoDto>>> GetMyTeams()
    {
        int userId = User.GetUserId();

        var playerUser = await _context.PlayerUsers
            .Include(pu => pu.Athlete)
            .ThenInclude(a => a.TeamMemberships)
            .ThenInclude(tm => tm.Team)
            .ThenInclude(t => t.Coach)
            .FirstOrDefaultAsync(pu => pu.Id == userId);

        if (playerUser?.Athlete == null)
            return NotFound("Player not found.");

        var teams = playerUser.Athlete.TeamMemberships.Select(tm => new TeamInfoDto
        {
            Id = tm.Team.Id,
            Name = tm.Team.Name,
            Coach = new CoachInfoDto
            {
                Id = tm.Team.Coach.Id,
                FirstName = tm.Team.Coach.FirstName,
                LastName = tm.Team.Coach.LastName,
                Email = tm.Team.Coach.Email
            },
            PlayerCount = tm.Team.TeamMemberships.Count
        }).ToList();

        return Ok(teams);
    }

    // GET: api/athletes/my-training-plans
    [HttpGet("my-training-plans")]
    public async Task<ActionResult<IEnumerable<TrainingPlanDto>>> GetMyTrainingPlans()
    {
        int userId = User.GetUserId();

        var playerUser = await _context.PlayerUsers
            .Include(pu => pu.Athlete)
            .FirstOrDefaultAsync(pu => pu.Id == userId);

        if (playerUser?.Athlete == null)
            return NotFound("Player not found.");

        var athleteId = playerUser.Athlete.Id;

        var query = _context.TrainingPlans
            .Include(tp => tp.Team)
            .Include(tp => tp.Athlete)
            .Where(tp =>
                tp.AthleteId == athleteId
                || (tp.TeamId != null && _context.TeamMemberships
                    .Any(tm => tm.TeamId == tp.TeamId && tm.AthleteId == athleteId))
            )
            .OrderBy(tp => tp.Date);

        query = System.Linq.Queryable.ThenBy<TrainingPlan, TimeOnly?>(
            query,
            tp => tp.StartTime
        );

        var trainingPlans = await query.ToListAsync();

        var dtoList = trainingPlans
            .Select(tp => tp.ToDto())
            .ToList();

        return Ok(dtoList);
    }

    // GET: api/athletes/teams/{teamId}/training-plans
    [HttpGet("teams/{teamId}/training-plans")]
    public async Task<ActionResult<IEnumerable<TrainingPlanDto>>> GetTeamTrainingPlans(int teamId)
    {
        int userId = User.GetUserId();

        var playerUser = await _context.PlayerUsers
            .Include(pu => pu.Athlete)
                .ThenInclude(a => a.TeamMemberships)
            .FirstOrDefaultAsync(pu => pu.AthleteId == userId);

        if (playerUser?.Athlete == null)
            return NotFound("Player not found.");

        var isMember = playerUser.Athlete.TeamMemberships
            .Any(tm => tm.TeamId == teamId);

        if (!isMember)
            return Forbid("You are not a member of this team.");

        var trainingPlans = await _context.TrainingPlans
            .Include(tp => tp.Team)
            .Include(tp => tp.Athlete)
            .Where(tp => tp.TeamId == teamId)
            .OrderBy(tp => tp.Date)
            .ThenBy(tp => tp.StartTime)
            .ToListAsync();

        var dtoList = trainingPlans.Select(tp => tp.ToDto()).ToList();
        return Ok(dtoList);
    }

    // GET: api/athletes/training-plans/{id}
    [HttpGet("training-plans/{id}")]
    public async Task<ActionResult<TrainingPlanDto>> GetTrainingPlan(int id)
    {
        int userId = User.GetUserId();

        var playerUser = await _context.PlayerUsers
            .Include(pu => pu.Athlete)
                .ThenInclude(a => a.TeamMemberships)
            .FirstOrDefaultAsync(pu => pu.AthleteId == userId);

        if (playerUser?.Athlete == null)
            return NotFound("Player not found.");

        var athleteId = playerUser.Athlete.Id;

        var trainingPlan = await _context.TrainingPlans
            .Include(tp => tp.Team)
            .Include(tp => tp.Athlete)
            .FirstOrDefaultAsync(tp => tp.Id == id && (
                tp.AthleteId == athleteId
                || (tp.TeamId != null && _context.TeamMemberships
                    .Any(tm => tm.TeamId == tp.TeamId && tm.AthleteId == athleteId))
            ));

        if (trainingPlan == null)
            return NotFound("Training plan not found or not accessible.");

        return Ok(trainingPlan.ToDto());
    }

    // GET: api/athletes/upcoming-training-plans
    [HttpGet("upcoming-training-plans")]
    public async Task<ActionResult<IEnumerable<TrainingPlanDto>>> GetUpcomingTrainingPlans()
    {
        int userId = User.GetUserId();

        var playerUser = await _context.PlayerUsers
            .Include(pu => pu.Athlete)
            .FirstOrDefaultAsync(pu => pu.AthleteId == userId);

        if (playerUser?.Athlete == null)
            return NotFound("Player not found.");

        var athleteId = playerUser.Athlete.Id;
        var today = DateOnly.FromDateTime(DateTime.Today);

        var upcomingTrainings = await _context.TrainingPlans
            .Include(tp => tp.Team)
            .Include(tp => tp.Athlete)
            .Where(tp => tp.Date >= today && (
                tp.AthleteId == athleteId
                || (tp.TeamId != null && _context.TeamMemberships
                    .Any(tm => tm.TeamId == tp.TeamId && tm.AthleteId == athleteId))
            ))
            .OrderBy(tp => tp.Date)
            .ThenBy(tp => tp.StartTime)
            .Take(10)
            .ToListAsync();

        var dtoList = upcomingTrainings.Select(tp => tp.ToDto()).ToList();
        return Ok(dtoList);
    }

    // GET: api/athletes/today-training-plans
    [HttpGet("today-training-plans")]
    public async Task<ActionResult<IEnumerable<TrainingPlanDto>>> GetTodayTrainingPlans()
    {
        int userId = User.GetUserId();

        var playerUser = await _context.PlayerUsers
            .Include(pu => pu.Athlete)
            .FirstOrDefaultAsync(pu => pu.AthleteId == userId);

        if (playerUser?.Athlete == null)
            return NotFound("Player not found.");

        var athleteId = playerUser.Athlete.Id;
        var today = DateOnly.FromDateTime(DateTime.Today);

        var todayTrainings = await _context.TrainingPlans
            .Include(tp => tp.Team)
            .Include(tp => tp.Athlete)
            .Where(tp => tp.Date == today && (
                tp.AthleteId == athleteId
                || (tp.TeamId != null && _context.TeamMemberships
                    .Any(tm => tm.TeamId == tp.TeamId && tm.AthleteId == athleteId))
            ))
            .OrderBy(tp => tp.StartTime)
            .ToListAsync();

        var dtoList = todayTrainings.Select(tp => tp.ToDto()).ToList();
        return Ok(dtoList);
    }
}
