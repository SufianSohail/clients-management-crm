using CRM.API.DTOs;
using CRM.API.Services;
using CRM.API.Models; // For SalesTeamType
using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRM.API.Controllers
{
    [Authorize]
[ApiController]
[Route("api/[controller]")]
public class ClientController : ControllerBase
    {
        private readonly ClientService _clientService;

public ClientController(ClientService clientService)
{
    _clientService = clientService;
}

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _clientService.GetAllClients();
            return Ok(result);
        }

        [HttpPost]
public async Task<IActionResult> Create([FromBody] CreateClientRequest request)
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    if (string.IsNullOrEmpty(userId))
        return Unauthorized();

    // 🔥 Get team from claim (we assume you stored it during login)
    var teamClaim = User.FindFirst("Team")?.Value;

    if (string.IsNullOrEmpty(teamClaim))
        return BadRequest("User team not found.");

    var userTeam = Enum.Parse<SalesTeamType>(teamClaim, true);

    var createdClient = await _clientService.CreateAsync(request, userId, userTeam);

    return Ok(createdClient);
}



        [HttpPut("{id}")]
public async Task<IActionResult> Update(string id, CreateClientRequest request)
{
    await _clientService.UpdateClient(id, request);
    return Ok();
}


        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            await _clientService.DeleteClient(id);
            return Ok();
        }
    }
}
