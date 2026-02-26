using CRM.API.Models;

namespace CRM.API.DTOs
{
    public class UpdateClientRequest
    {
        public string CompanyName { get; set; } = string.Empty;

        public string ContactName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        public UrgencyLevel Urgency { get; set; }

        public string AssignedSalesPersonId { get; set; } = string.Empty;

        public List<string> FeatureIds { get; set; } = new();

        public List<string> UpsellIds { get; set; } = new();

        public DateTime ContractStartDate { get; set; }

        public DateTime ContractEndDate { get; set; }
    }
}
