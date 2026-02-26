using CRM.API.Services;
using CRM.API.DTOs;
using CRM.API.Models;
using MongoDB.Driver; // 🔥 Required for MongoDB operations
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CRM.API.Database;
using BCrypt.Net;
namespace CRM.API.Seed
{
    public static class DatabaseSeeder
    {
        // Seed clients
        public static async Task SeedClients(ClientService clientService)
        {
            var existingClients = await clientService.GetAllAsync();
            if (existingClients.Any()) return;

            // Client 1
            await clientService.CreateAsync(
                new CreateClientRequest
                {
                    CompanyName = "ABC Pvt Ltd",
                    ContactName = "John",
                    PhoneNumber = "03000000000",
                    Email = "abc@test.com",
                    FeaturesGiven = new List<string> { "Premium Support" },
                    UpsellOpportunities = new List<string> { "Analytics" },
                    Urgency = "High",
                    ContractStartDate = DateTime.UtcNow.AddMonths(-1),
                    ContractEndDate = DateTime.UtcNow.AddMonths(6),
                    AssignedSalesPersonId = "Support"
                },
                "SeederUser",               // Logged-in user id simulation
                SalesTeamType.Sales         // Assigned team simulation
            );

            // Client 2
            await clientService.CreateAsync(
                new CreateClientRequest
                {
                    CompanyName = "Systems Pvt Ltd",
                    ContactName = "Kelly",
                    PhoneNumber = "03000000090",
                    Email = "kelly.systems@test.com",
                    FeaturesGiven = new List<string> { "Email Marketing Engine" },
                    UpsellOpportunities = new List<string> { "Manage Sessions" },
                    Urgency = "Medium",
                    ContractStartDate = DateTime.UtcNow.AddMonths(-2),
                    ContractEndDate = DateTime.UtcNow.AddMonths(3),
                    AssignedSalesPersonId = "Simran"
                },
                "SeederUser",
                SalesTeamType.Sales
            );
        }

        // Seed users
        public static async Task SeedUsers(MongoDbContext context)
        {
            var existingUser = await context.Users.Find(_ => true).FirstOrDefaultAsync();
            if (existingUser != null) return;

            await context.Users.InsertOneAsync(new User
{
    FullName = "Sohaib",
    Email = "sohaib@crm.com",
    PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"), // HASH IT!
    Team = SalesTeamType.Sohaib,
    Role = "Support",
    IsActive = true
});
        }

        // 🔥 General method to call both seeds
        public static async Task SeedAll(ClientService clientService, MongoDbContext context)
        {
            await SeedUsers(context);
            await SeedClients(clientService);
        }
    }
}
