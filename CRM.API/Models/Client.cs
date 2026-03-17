using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CRM.API.Models
{
    public class Client
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string CompanyName { get; set; } = string.Empty;
        public string ContactName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        public List<string> FeaturesGiven { get; set; } = new();
        public List<string> UpsellOpportunities { get; set; } = new();

        public UrgencyLevel Urgency { get; set; }

        public DateTime ContractStartDate { get; set; }
        public DateTime ContractEndDate { get; set; }

        public string AssignedSalesPersonId { get; set; } = string.Empty;

        public SalesTeamType AssignedTeam { get; set; }

        public string CreatedByUserId { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<Document> Documents { get; set; } = new();
    }
}
