using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CRM.API.Services;
using CRM.API.Models;
using CRM.API.DTOs;
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
        private readonly UserService _userService;
        private readonly IEmailService _emailService;

        public CommentController(CommentService commentService, ClientService clientService, UserService userService, IEmailService emailService)
        {
            _commentService = commentService;
            _clientService = clientService;
            _userService = userService;
            _emailService = emailService;
        }

        [HttpGet("client/{clientId}")]
        public async Task<IActionResult> GetByClient(string clientId)
        {
            var client = await _clientService.GetByIdAsync(clientId);
            if (client == null)
                return NotFound("Client not found.");

            var comments = await _commentService.GetByClientIdAsync(clientId);

            // Enrich with user names
            var userIds = comments.Select(c => c.CommentedByUserId).Distinct().ToList();
            var users = new Dictionary<string, string>();
            foreach (var uid in userIds)
            {
                var user = await _userService.GetByIdAsync(uid);
                users[uid] = user?.FullName ?? "Unknown";
            }

            var result = comments.Select(c => new CommentResponseDto
            {
                Id = c.Id ?? string.Empty,
                ClientId = c.ClientId,
                Text = c.Text,
                CommentedByUserId = c.CommentedByUserId,
                CommentedByName = users.TryGetValue(c.CommentedByUserId, out var name) ? name : "Unknown",
                CommentDate = c.CommentDate
            });

            return Ok(result);
        }

        [HttpPost("client/{clientId}")]
        public async Task<IActionResult> AddComment(string clientId, [FromBody] AddCommentRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Text))
                return BadRequest("Comment text cannot be empty.");

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var comment = new Comment
            {
                ClientId = clientId,
                Text = request.Text.Trim(),
                CommentedByUserId = userId,
                CommentDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            await _commentService.CreateAsync(comment);

            // Enrich with user name for response
            var user = await _userService.GetByIdAsync(userId);
            var fromName = user?.FullName ?? "Unknown User";

            // Process Mentions
            await ProcessMentionsAsync(request.Text, fromName);

            var response = new CommentResponseDto
            {
                Id = comment.Id ?? string.Empty,
                ClientId = comment.ClientId,
                Text = comment.Text,
                CommentedByUserId = comment.CommentedByUserId,
                CommentedByName = user?.FullName ?? "Unknown",
                CommentDate = comment.CommentDate
            };

            return Ok(response);
        }

        private async Task ProcessMentionsAsync(string text, string fromName)
        {
            // Simple extraction: split by space and find words starting with "@"
            var words = text.Split(new[] { ' ', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
            var mentions = words.Where(w => w.StartsWith("@") && w.Length > 1).Select(w => w.ToLower()).ToList();

            if (!mentions.Any()) return;

            // Fetch all users to match against handles
            var allUsers = await _userService.GetAllAsync();
            
            foreach (var u in allUsers)
            {
                var handle = "@" + u.FullName.Split(' ')[0].ToLower();
                if (mentions.Contains(handle))
                {
                    // Trigger email notification
                    await _emailService.SendMentionEmailAsync(u.Email, u.FullName, fromName, text);
                }
            }
        }
    }
}
