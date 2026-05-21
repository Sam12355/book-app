using BookApi.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BookApi.Tests.Integration;

// Boots the real API in memory using a SQLite in-memory database
// Using SQLite (not the InMemory provider) avoids a two-provider conflict and lets migrations run
public class BookApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection;

    public BookApiFactory()
    {
        // Named shared in-memory SQLite database — persists as long as this connection stays open
        _connection = new SqliteConnection($"Data Source={Guid.NewGuid()};Mode=Memory;Cache=Shared");
        _connection.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove the file-based SQLite registration from Program.cs
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));

            if (descriptor != null)
                services.Remove(descriptor);

            // Replace with the in-memory SQLite connection
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite(_connection));
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
            _connection.Dispose();
    }
}
