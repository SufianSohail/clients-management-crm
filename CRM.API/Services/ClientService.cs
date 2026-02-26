using CRM.API.Database;
using CRM.API.DTOs;
using CRM.API.Models;
using MongoDB.Driver;
using System.Security.Claims;

namespace CRM.API.Services
{
    public class ClientService
    {
        private readonly MongoDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ClientService(MongoDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        private async Task<User> GetLoggedInUser()
        {
            var userId = _httpContextAccessor.HttpContext?
                .User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
                throw new Exception("Unauthorized");

            return await _context.Users
                .Find(u => u.Id == userId)
                .FirstOrDefaultAsync();
        }

        public async Task<Client> CreateAsync(CreateClientRequest request, string userId, SalesTeamType userTeam)
{
    var client = new Client
    {
        CompanyName = request.CompanyName,
        ContactName = request.ContactName,
        PhoneNumber = request.PhoneNumber,
        Email = request.Email,
        FeaturesGiven = request.FeaturesGiven ?? new List<string>(),
        UpsellOpportunities = request.UpsellOpportunities ?? new List<string>(),
        Urgency = Enum.Parse<UrgencyLevel>(request.Urgency, true),
        ContractStartDate = request.ContractStartDate,
        ContractEndDate = request.ContractEndDate,
        AssignedSalesPersonId = request.AssignedSalesPersonId,
        AssignedTeam = userTeam  // ✅ Important: always assign the team
    };

    await _context.Clients.InsertOneAsync(client);
    return client;
}


        public async Task<List<Client>> GetAllClients()
        {
            var user = await GetLoggedInUser();

            return await _context.Clients
                .Find(c => c.AssignedTeam == user.Team)
                .ToListAsync();
        }
        public async Task<List<Client>> GetAllAsync()
{
    return await _context.Clients.Find(_ => true).ToListAsync();
}

public async Task<Client?> GetByIdAsync(string id)
{
    return await _context.Clients.Find(c => c.Id == id).FirstOrDefaultAsync();
}

        public async Task UpdateClient(string id, CreateClientRequest request)
        {
            var update = Builders<Client>.Update
                .Set(x => x.CompanyName, request.CompanyName)
                .Set(x => x.ContactName, request.ContactName)
                .Set(x => x.PhoneNumber, request.PhoneNumber)
                .Set(x => x.Email, request.Email)
                .Set(x => x.FeaturesGiven, request.FeaturesGiven)
                .Set(x => x.UpsellOpportunities, request.UpsellOpportunities)
                .Set(x => x.Urgency, Enum.Parse<UrgencyLevel>(request.Urgency, true))
                .Set(x => x.ContractStartDate, request.ContractStartDate)
                .Set(x => x.ContractEndDate, request.ContractEndDate)
                .Set(x => x.AssignedSalesPersonId, request.AssignedSalesPersonId);

            await _context.Clients.UpdateOneAsync(c => c.Id == id, update);
        }

        public async Task DeleteClient(string id)
        {
            await _context.Clients.DeleteOneAsync(c => c.Id == id);
        }
    }
}
