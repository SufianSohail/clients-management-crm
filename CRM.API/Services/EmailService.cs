using System.Net.Mail;
using Microsoft.Extensions.Logging;

namespace CRM.API.Services
{
    public interface IEmailService
    {
        Task SendMentionEmailAsync(string toEmail, string toName, string fromName, string commentText);
    }

    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;

        public EmailService(ILogger<EmailService> logger)
        {
            _logger = logger;
        }

        public Task SendMentionEmailAsync(string toEmail, string toName, string fromName, string commentText)
        {
            // In a real application, you would configure SMTP settings
            // and use SmtpClient or a service like SendGrid, AWS SES, etc.
            
            string subject = $"You were mentioned in a comment by {fromName}";
            string body = $"Hello {toName},\n\n{fromName} has tagged you in a comment:\n\n\"{commentText}\"\n\nLog in to the CRM to view the conversation.";

            _logger.LogInformation("\n================================================");
            _logger.LogInformation("📧 [EMAIL NOTIFICATION TRIGGERED]");
            _logger.LogInformation($"To: {toEmail} ({toName})");
            _logger.LogInformation($"Subject: {subject}");
            _logger.LogInformation($"Body:\n{body}");
            _logger.LogInformation("================================================\n");

            // For now, we just simulate a successful send.
            return Task.CompletedTask;
        }
    }
}
