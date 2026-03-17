using System;
using System.Threading.Tasks;
using MongoDB.Driver;

class Program
{
    static async Task Main(string[] args)
    {
        var connectionString = "mongodb://localhost:27017";
        var client = new MongoClient(connectionString);
        var database = client.GetDatabase("ClientManagement");
        
        await database.DropCollectionAsync("Users");
        await database.DropCollectionAsync("Clients");
        await database.DropCollectionAsync("Comments");
        
        Console.WriteLine("Successfully dropped Users, Clients, and Comments collections.");
    }
}
