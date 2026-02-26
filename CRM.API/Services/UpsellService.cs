using CRM.API.Models;
using CRM.API.Database;
using MongoDB.Driver;

namespace CRM.API.Services
{
    public class UpsellService
    {
        private readonly IMongoCollection<Upsell> _upsells;

        public UpsellService(MongoDbContext context)
        {
            _upsells = context.Upsells;
        }

        public async Task<List<Upsell>> GetAllAsync()
        {
            return await _upsells.Find(_ => true).ToListAsync();
        }

        public async Task<Upsell?> GetByIdAsync(string id)
        {
            return await _upsells.Find(u => u.Id == id).FirstOrDefaultAsync();
        }

        public async Task<Upsell> CreateAsync(Upsell upsell)
        {
            upsell.CreatedDate = DateTime.UtcNow;
            await _upsells.InsertOneAsync(upsell);
            return upsell;
        }

        public async Task UpdateAsync(string id, Upsell upsell)
        {
            await _upsells.ReplaceOneAsync(u => u.Id == id, upsell);
        }

        public async Task DeleteAsync(string id)
        {
            await _upsells.DeleteOneAsync(u => u.Id == id);
        }
    }
}
