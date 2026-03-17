using CRM.API.Services;
using CRM.API.DTOs;
using CRM.API.Models;
using MongoDB.Driver;
using CRM.API.Database;

namespace CRM.API.Seed
{
    public static class DatabaseSeeder
    {
        private static readonly List<(string FullName, string Email, string FirstName, string Password, SalesTeamType Team)> UserDefinitions = new()
        {
            // Sohaib Team
            ("Sohaib Ahmed",    "sohaib@eventcombo.com",        "Sohaib",   "Sohaib@123", SalesTeamType.Sohaib),
            ("Simran Gurung",   "simran@eventcombo.com",        "Simran",   "Simran@123", SalesTeamType.Sohaib),
            ("Carol Castelino", "carol.castelino@eventcombo.com","Carol",   "Carol@123", SalesTeamType.Sohaib),
            ("Shayan Murtaza",  "shayan.murtaza@eventcombo.com","Shayan",   "Shayan@123", SalesTeamType.Sohaib),
            // Sana Team
            ("Sana Aslam",      "sana@eventcombo.com",                 "Sana",     "Sana@123", SalesTeamType.Sana),
            ("Faryal Zubair",   "faryal.zubair@eventcombo.com", "Faryal",   "Faryal@123", SalesTeamType.Sana),
            ("Arti Luhanch",    "arti@eventcombo.com",          "Arti",     "Arti@123", SalesTeamType.Sana),
            // Sales Team
            ("Priya Debbarma",  "priya.debbarma@eventcombo.com","Priya",    "Priya@123", SalesTeamType.Sales),
            ("Adarshika Limbu", "adarshika@eventcombo.com",     "Adarshika","Adarshika@123", SalesTeamType.Sales),
        };

        public static async Task SeedUsers(MongoDbContext context)
        {
            foreach (var (fullName, email, firstName, password, team) in UserDefinitions)
            {
                var exists = await context.Users.Find(u => u.Email == email).AnyAsync();
                if (!exists)
                {
                    await context.Users.InsertOneAsync(new User
                    {
                        FullName = fullName,
                        Email = email,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                        Team = team,
                        Role = "Support",
                        IsActive = true
                    });
                }
            }
        }

        public static async Task SeedClients(ClientService clientService, MongoDbContext context)
        {
            var existingClients = await clientService.GetAllAsync();
            if (existingClients.Any()) return;

            var sohaibUser = await context.Users.Find(u => u.Team == SalesTeamType.Sohaib).FirstOrDefaultAsync();
            var sanaUser   = await context.Users.Find(u => u.Team == SalesTeamType.Sana).FirstOrDefaultAsync();
            var salesUser  = await context.Users.Find(u => u.Team == SalesTeamType.Sales).FirstOrDefaultAsync();

            var sohaibId = sohaibUser?.Id ?? string.Empty;
            var sanaId   = sanaUser?.Id   ?? string.Empty;
            var salesId  = salesUser?.Id  ?? string.Empty;

            await clientService.CreateAsync(new CreateClientRequest
            {
                CompanyName = "ABC Pvt Ltd",
                ContactName = "John Doe",
                PhoneNumber = "03001234567",
                Email = "john@abc.com",
                FeaturesGiven = new List<string> { "Premium Support", "API Access" },
                UpsellOpportunities = new List<string> { "Analytics Dashboard" },
                Urgency = "High",
                ContractStartDate = DateTime.UtcNow.AddMonths(-1),
                ContractEndDate = DateTime.UtcNow.AddMonths(6),
                AssignedSalesPersonId = sohaibId,
            }, sohaibId, SalesTeamType.Sohaib);

            await clientService.CreateAsync(new CreateClientRequest
            {
                CompanyName = "Systems Pvt Ltd",
                ContactName = "Kelly Smith",
                PhoneNumber = "03009876543",
                Email = "kelly@systems.com",
                FeaturesGiven = new List<string> { "Email Marketing Engine" },
                UpsellOpportunities = new List<string> { "Manage Sessions", "White Labeling" },
                Urgency = "Medium",
                ContractStartDate = DateTime.UtcNow.AddMonths(-2),
                ContractEndDate = DateTime.UtcNow.AddMonths(3),
                AssignedSalesPersonId = salesId,
            }, salesId, SalesTeamType.Sales);

            await clientService.CreateAsync(new CreateClientRequest
            {
                CompanyName = "Global Enterprise",
                ContactName = "Sara Ahmed",
                PhoneNumber = "03111222333",
                Email = "sara@globalent.com",
                FeaturesGiven = new List<string> { "CRM Integration", "Analytics", "SSO" },
                UpsellOpportunities = new List<string> { "White Labeling", "Dedicated Support" },
                Urgency = "Low",
                ContractStartDate = DateTime.UtcNow.AddMonths(-3),
                ContractEndDate = DateTime.UtcNow.AddMonths(9),
                AssignedSalesPersonId = sanaId,
            }, sanaId, SalesTeamType.Sana);
        }

        public static async Task SeedAll(ClientService clientService, MongoDbContext context)
        {
            await SeedUsers(context);
            await SeedClients(clientService, context);
        }
    }
}
