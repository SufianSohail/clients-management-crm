using CRM.API.DTOs;
using CRM.API.Services;
using CRM.API.Models;
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
        private readonly UserService _userService;

        public ClientController(ClientService clientService, UserService userService)
        {
            _clientService = clientService;
            _userService = userService;
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

            var teamClaim = User.FindFirst("Team")?.Value;
            if (string.IsNullOrEmpty(teamClaim))
                return BadRequest("User team not found.");

            var userTeam = Enum.Parse<SalesTeamType>(teamClaim, true);
            var createdClient = await _clientService.CreateAsync(request, userId, userTeam);
            return Ok(createdClient);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] CreateClientRequest request)
        {
            await _clientService.UpdateClient(id, request);
            var updated = await _clientService.GetByIdAsync(id);
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            await _clientService.DeleteClient(id);
            return Ok();
        }

        // POST /api/client/{id}/documents  — multipart file upload
        [HttpPost("{id}/documents")]
        public async Task<IActionResult> UploadDocument(string id, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file provided.");

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

            // Save to wwwroot/uploads
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var document = new Document
            {
                Id = Guid.NewGuid().ToString(),
                Name = file.FileName,
                FileUrl = $"/uploads/{uniqueFileName}",
                UploadedByUserId = userId,
                UploadedDate = DateTime.UtcNow
            };

            var result = await _clientService.AddDocumentAsync(id, document);
            if (result == null)
                return NotFound("Client not found.");

            return Ok(document);
        }

        // DELETE /api/client/{id}/documents/{docId}
        [HttpDelete("{id}/documents/{docId}")]
        public async Task<IActionResult> DeleteDocument(string id, string docId)
        {
            var removed = await _clientService.RemoveDocumentAsync(id, docId);
            if (!removed)
                return NotFound("Document or client not found.");
            return Ok();
        }
    }
}
