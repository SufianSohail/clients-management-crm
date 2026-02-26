using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CRM.API.Models
{
    public class Comment
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string ClientId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string Text { get; set; } = string.Empty;

        [BsonRepresentation(BsonType.ObjectId)]
        public string CommentedByUserId { get; set; } = string.Empty;

        public DateTime CommentDate { get; set; } = DateTime.UtcNow;
    }
}
