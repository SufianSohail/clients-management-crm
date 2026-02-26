using CRM.API.Database;
using CRM.API.Models;
using MongoDB.Driver;

namespace CRM.API.Services
{
    public class CommentService
    {
        private readonly IMongoCollection<Comment> _comments;

        public CommentService(MongoDbContext context)
        {
            _comments = context.Comments;
        }

        public async Task<List<Comment>> GetByClientIdAsync(string clientId)
        {
            return await _comments
                .Find(c => c.ClientId == clientId)
                .SortByDescending(c => c.CommentDate)
                .ToListAsync();
        }

        public async Task<Comment?> GetLatestByClientIdAsync(string clientId)
        {
            return await _comments
                .Find(c => c.ClientId == clientId)
                .SortByDescending(c => c.CommentDate)
                .FirstOrDefaultAsync();
        }

        public async Task<Comment> CreateAsync(Comment comment)
        {
            await _comments.InsertOneAsync(comment);
            return comment;
        }

        public async Task DeleteAsync(string id)
        {
            await _comments.DeleteOneAsync(c => c.Id == id);
        }
    }
}
