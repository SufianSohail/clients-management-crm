using CRM.API.Models;
using CRM.API.Database;
using MongoDB.Driver;

namespace CRM.API.Services
{
    public class FeatureService
    {
        private readonly IMongoCollection<Feature> _features;

        public FeatureService(MongoDbContext context)
        {
            _features = context.Features;
        }

        public async Task<List<Feature>> GetAllAsync()
        {
            return await _features.Find(_ => true).ToListAsync();
        }

        public async Task<Feature?> GetByIdAsync(string id)
        {
            return await _features.Find(f => f.Id == id).FirstOrDefaultAsync();
        }

        public async Task<Feature> CreateAsync(Feature feature)
        {
            feature.CreatedDate = DateTime.UtcNow;
            await _features.InsertOneAsync(feature);
            return feature;
        }

        public async Task UpdateAsync(string id, Feature feature)
        {
            await _features.ReplaceOneAsync(f => f.Id == id, feature);
        }

        public async Task DeleteAsync(string id)
        {
            await _features.DeleteOneAsync(f => f.Id == id);
        }
    }
}
