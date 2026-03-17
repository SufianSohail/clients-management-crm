using CRM.API.Models;
using CRM.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly UserService _userService;

        public UsersController(UserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userService.GetAllAsync();
            var result = users.Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                Team = u.Team.ToString(),
                u.Role,
                u.IsActive
            });
            return Ok(result);
        }
    }
}
