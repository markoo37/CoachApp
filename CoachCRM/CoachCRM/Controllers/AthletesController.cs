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

        var athleteIds = await _context.CoachAthletes
            .Where(ca => ca.CoachId == coach.Id)
            .Select(ca => ca.AthleteId)
            .ToListAsync();

        var athletes = await _context.Athletes
            .Where(a => athleteIds.Contains(a.Id))
            .ToListAsync();

        // minden Player user emailjét előre lekérjük
        var playerEmails = await _context.Users
            .Where(u => u.UserType == "Player")
            .Select(u => u.Email)
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
            HasUserAccount = !string.IsNullOrEmpty(a.Email) &&
                             playerEmails.Contains(a.Email),
            TeamIds = a.TeamMemberships.Select(tm => tm.TeamId).ToList()
        }).ToList();

        return Ok(dtoList);
    }

    
    // GET: api/athletes/available-for-team/{teamId}
    [HttpGet("available-for-team/{teamId}")]
    public async Task<ActionResult<IEnumerable<AthleteDto>>> GetAvailableForTeam(int teamId)
    {
        int userId = User.GetUserId();

        // 1) Lekérjük az aktuális edzőt
        var coach = await _context.Coaches
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (coach == null)
            return Unauthorized("Coach not found.");

        // 2) Ellenőrizzük, hogy a csapat tényleg ehhez az edzőhöz tartozik-e
        var team = await _context.Teams
            .FirstOrDefaultAsync(t => t.Id == teamId && t.CoachId == coach.Id);

        if (team == null)
            return Forbid("This team does not belong to the current coach.");

        // 3) Az edzőhöz tartozó sportolók ID-i (CoachAthletes kapcsolat)
        var coachAthleteIds = await _context.CoachAthletes
            .Where(ca => ca.CoachId == coach.Id)
            .Select(ca => ca.AthleteId)
            .ToListAsync();

        // 4) Akik már benne vannak ebben a csapatban
        var teamAthleteIds = await _context.TeamMemberships
            .Where(tm => tm.TeamId == teamId)
            .Select(tm => tm.AthleteId)
            .ToListAsync();

        // 5) Azok az Athletes rekordok:
        //    - akik az edzőhöz tartoznak
        //    - még nincsenek ebben a csapatban
        //    - már regisztráltak az appba (UserId != null)
        var athletes = await _context.Athletes
            .Where(a =>
                coachAthleteIds.Contains(a.Id) &&
                !teamAthleteIds.Contains(a.Id) &&
                a.UserId != null)
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
            HasUserAccount = true, // mert a.UserId != null-re szűrtünk
            TeamIds = a.TeamMemberships.Select(tm => tm.TeamId).ToList()
        }).ToList();

        return Ok(dtoList);
    }
    
    // POST: api/athletes/{athleteId}/assign-to-team/{teamId}
    [HttpPost("{athleteId}/assign-to-team/{teamId}")]
    public async Task<IActionResult> AssignAthleteToTeam(int athleteId, int teamId)
    {
        int userId = User.GetUserId();

        // 1) Aktuális coach
        var coach = await _context.Coaches
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (coach == null)
            return Unauthorized("Coach not found.");

        // 2) Csapat ellenőrzése (ehhez a coach-hoz tartozzon)
        var team = await _context.Teams
            .FirstOrDefaultAsync(t => t.Id == teamId && t.CoachId == coach.Id);

        if (team == null)
            return Forbid("This team does not belong to the current coach.");

        // 3) Sportoló tényleg az edzőé-e (CoachAthletes tábla)
        var coachAthlete = await _context.CoachAthletes
            .FirstOrDefaultAsync(ca => ca.CoachId == coach.Id && ca.AthleteId == athleteId);

        if (coachAthlete == null)
            return Forbid("This athlete is not linked to the current coach.");

        // 4) Már tagja a csapatnak?
        bool alreadyMember = await _context.TeamMemberships
            .AnyAsync(tm => tm.TeamId == teamId && tm.AthleteId == athleteId);

        if (alreadyMember)
            return BadRequest(new { message = "A sportoló már tagja ennek a csapatnak." });

        // 5) TeamMembership létrehozása
        var membership = new TeamMembership
        {
            AthleteId = athleteId,
            TeamId = teamId,
            JoinedAt = DateTime.UtcNow,
            Role = "Player" // vagy amit szeretnél
        };

        _context.TeamMemberships.Add(membership);
        await _context.SaveChangesAsync();

        // 6) HasUserAccount kiszámolása (Athlete.UserId alapján)
        var athlete = await _context.Athletes
            .FirstOrDefaultAsync(a => a.Id == athleteId);

        bool hasUserAccount = athlete?.UserId != null;

        // A frontend ezt az objektumot várja vissza
        return Ok(new
        {
            AthleteId = athleteId,
            TeamId = teamId,
            HasUserAccount = hasUserAccount
        });
    }


    // POST: api/athletes/add-by-email
    [HttpPost("add-by-email")]
    public async Task<IActionResult> AddAthleteByEmail([FromBody] CreateAthleteByEmailDto dto)
    {
        int userId = User.GetUserId();
        var coach = await _context.Coaches.FirstOrDefaultAsync(c => c.UserId == userId);
        if (coach == null) return Unauthorized();

        dto.Email = dto.Email.Trim().ToLowerInvariant();

        // 1) megpróbálunk Athletet találni ezzel az emaillel
        var athlete = await _context.Athletes
            .FirstOrDefaultAsync(a => a.Email.ToLower() == dto.Email);

        // 2) ha nincs Athlete, megnézzük, regisztrált-e már Player userként
        if (athlete == null)
        {
            var playerUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email && u.UserType == "Player");

            athlete = new Athlete
            {
                Email = dto.Email,
                UserId = playerUser?.Id
            };

            _context.Athletes.Add(athlete);
            await _context.SaveChangesAsync();
        }
        else if (athlete.UserId == null)
        {
            // ha eddig nem volt összekötve userrel, de időközben regisztrált
            var playerUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email && u.UserType == "Player");

            if (playerUser != null)
            {
                athlete.UserId = playerUser.Id;
                await _context.SaveChangesAsync();
            }
        }

        // 3) edző–sportoló kapcsolat
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

        // opcionálisan visszaadhatsz egy DTO-t is, de a mostani frontendnek elég az Id
        return Ok(new
        {
            AthleteId = athlete.Id,
            HasUserAccount = athlete.UserId != null
        });
    }

    
    // POST: api/athletes/{athleteId}/remove-from-team/{teamId}
    [HttpPost("{athleteId}/remove-from-team/{teamId}")]
    public async Task<IActionResult> RemoveAthleteFromTeam(int athleteId, int teamId)
    {
        int userId = User.GetUserId();

        var coach = await _context.Coaches
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (coach == null)
            return Unauthorized("Coach not found.");

        // Csapat ellenőrzése
        var team = await _context.Teams
            .FirstOrDefaultAsync(t => t.Id == teamId && t.CoachId == coach.Id);

        if (team == null)
            return Forbid("This team does not belong to the current coach.");

        var membership = await _context.TeamMemberships
            .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.AthleteId == athleteId);

        if (membership == null)
            return NotFound(new { message = "A sportoló nem tagja ennek a csapatnak." });

        _context.TeamMemberships.Remove(membership);
        await _context.SaveChangesAsync();

        return Ok();
    }


    // DELETE: api/athletes/remove-from-coach/{athleteId}
    [HttpDelete("remove-from-coach/{athleteId}")]
    public async Task<IActionResult> RemoveAthleteFromCoach(int athleteId)
    {
        int userId = User.GetUserId();

        // 1) Aktuális coach lekérése
        var coach = await _context.Coaches
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (coach == null)
            return Unauthorized("Coach not found.");

        // 2) Coach–Athlete kapcsolat (CoachAthletes tábla)
        var relation = await _context.CoachAthletes
            .FirstOrDefaultAsync(ca => ca.CoachId == coach.Id && ca.AthleteId == athleteId);

        if (relation == null)
            return NotFound("Ez a játékos nincs ehhez az edzőhöz kapcsolva.");

        // 3) Az edző összes csapata
        var coachTeamIds = await _context.Teams
            .Where(t => t.CoachId == coach.Id)
            .Select(t => t.Id)
            .ToListAsync();

        // 4) Az adott játékos tagságai ezekben a csapatokban
        var memberships = await _context.TeamMemberships
            .Where(tm => tm.AthleteId == athleteId && coachTeamIds.Contains(tm.TeamId))
            .ToListAsync();

        // 5) Csapattagságok törlése (DE NEM az Athlete/User!)
        _context.TeamMemberships.RemoveRange(memberships);

        // 6) Coach–Athlete kapcsolat törlése
        _context.CoachAthletes.Remove(relation);

        await _context.SaveChangesAsync();

        return Ok(new { message = "A sportoló eltávolítva az edzőtől és az edző csapataiból." });
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
            .FirstOrDefaultAsync(pu => pu.Id == userId);

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
            .FirstOrDefaultAsync(pu => pu.Id == userId);

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
            .FirstOrDefaultAsync(pu => pu.Id == userId);

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
            .FirstOrDefaultAsync(pu => pu.Id == userId);

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
            .FirstOrDefaultAsync(pu => pu.Id == userId);

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
