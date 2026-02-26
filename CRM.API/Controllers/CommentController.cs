using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CRM.API.Services;
using CRM.API.Models;
using System.Security.Claims;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CommentController : ControllerBase
    {
        private readonly CommentService _commentService;
        private readonly ClientService _clientService;

        public CommentController(CommentService commentService, ClientService clientService)
        {
            _commentService = commentService;
            _clientService = clientService;
        }

        [HttpGet("client/{clientId}")]
        public async Task<IActionResult> GetByClient(string clientId)
        {
            var client = await _clientService.GetByIdAsync(clientId);
            if (client == null)
                return NotFound("Client not found.");

            var comments = await _commentService.GetByClientIdAsync(clientId);
            return Ok(comments);
        }

        [HttpPost("client/{clientId}")]
        public async Task<IActionResult> AddComment(string clientId, [FromBody] string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return BadRequest("Comment text cannot be empty.");

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var comment = new Comment
            {
                ClientId = clientId,
                Text = text.Trim(),
                CommentedByUserId = userId
            };

            await _commentService.CreateAsync(comment);
            return Ok(comment);
        }
    }
}
