using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CRM.API.Models
{
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public bool IsActive { get; set; } = true;

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        // Team Assignment (Sohaib / Sana / Sales)
        public SalesTeamType Team { get; set; }

        // Role (Future ready: Admin / Manager / Support)
        public string Role { get; set; } = "Support";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
