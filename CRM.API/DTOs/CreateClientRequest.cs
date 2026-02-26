using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs
{
    public class CreateClientRequest
    {
        [Required]
        public string CompanyName { get; set; } = string.Empty;

        [Required]
        public string ContactName { get; set; } = string.Empty;

        [Required]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        public string Email { get; set; } = string.Empty;

        public List<string> FeaturesGiven { get; set; } = new();
        public List<string> UpsellOpportunities { get; set; } = new();

        [Required]
        public string Urgency { get; set; } = "Low";

        public DateTime ContractStartDate { get; set; }
        public DateTime ContractEndDate { get; set; }

        [Required]
        public string AssignedSalesPersonId { get; set; } = string.Empty;
    }
}
