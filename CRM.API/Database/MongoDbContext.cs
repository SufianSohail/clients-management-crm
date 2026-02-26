using CRM.API.Models;
using MongoDB.Driver;

namespace CRM.API.Database
{
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;

        public MongoDbContext(IConfiguration configuration)
        {
            var connectionString = configuration["MONGO_CONNECTION"];
            var databaseName = configuration["DATABASE_NAME"];

            if (string.IsNullOrWhiteSpace(connectionString))
                throw new Exception("MONGO_CONNECTION is not configured.");

            if (string.IsNullOrWhiteSpace(databaseName))
                throw new Exception("DATABASE_NAME is not configured.");

            var client = new MongoClient(connectionString);
            _database = client.GetDatabase(databaseName);
        }

        public IMongoCollection<Client> Clients =>
            _database.GetCollection<Client>("Clients");

        public IMongoCollection<User> Users =>
            _database.GetCollection<User>("Users");

        public IMongoCollection<Feature> Features =>
            _database.GetCollection<Feature>("Features");

        public IMongoCollection<Upsell> Upsells =>
            _database.GetCollection<Upsell>("Upsells");

        public IMongoCollection<Comment> Comments =>
            _database.GetCollection<Comment>("Comments");
    }
}
