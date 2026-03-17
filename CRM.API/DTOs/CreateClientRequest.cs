using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace CRM.API.DTOs
{
    public class CreateClientRequest
    {
        [Required]
        public string CompanyName { get; set; } = string.Empty;

        [Required]
        public string ContactName { get; set; } = string.Empty;

        [RegularExpression(@"^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,8}$|^0[0-9]{9,14}$",
            ErrorMessage = "Invalid phone number format. Use formats like 03001234567, +923001234567, or (555) 123-4567.")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; } = string.Empty;

        public List<string> FeaturesGiven { get; set; } = new();
        public List<string> UpsellOpportunities { get; set; } = new();

        [Required]
        public string Urgency { get; set; } = "Low";

        public DateTime ContractStartDate { get; set; }
        public DateTime ContractEndDate { get; set; }

        public string AssignedSalesPersonId { get; set; } = string.Empty;

        /// <summary>If provided, overrides the team on update (admin override).</summary>
        public string? AssignedTeamOverride { get; set; }
    }
}
