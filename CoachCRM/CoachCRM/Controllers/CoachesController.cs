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
    public class CoachesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CoachesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/coaches (megváltozik → mindig csak saját coach adat)
        [HttpGet]
        public async Task<ActionResult<CoachDto>> GetCoach()
        {
            int userId = User.GetUserId();

            var coach = await _context.Coaches
                .Include(c => c.Teams)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (coach == null)
            {
                return NotFound();
            }

            return Ok(coach.ToDto());
        }

        // POST már nem kell → regisztrációkor létrehozzuk automatikusan a Coach rekordot

        // PUT: api/coaches
        [HttpPut]
        public async Task<IActionResult> UpdateCoach(UpdateCoachDto dto)
        {
            int userId = User.GetUserId();

            var coach = await _context.Coaches
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (coach == null)
            {
                return NotFound();
            }

            coach.FirstName = dto.FirstName;
            coach.LastName = dto.LastName;
            coach.Email = dto.Email;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE sem kell → coach saját magát nem törölheti backendből (opcionális)
    }
}