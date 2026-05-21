using BookApi.Data;
using BookApi.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace BookApi.Tests;

public class AuthServiceTests
{
    // Creates a fresh in-memory database for each test so tests never share state
    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    // Builds a minimal IConfiguration that satisfies the JWT key/issuer/audience requirements
    private static IConfiguration CreateConfig() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"]      = "this-is-a-super-secret-key-change-in-production-min32chars!",
                ["Jwt:Issuer"]   = "BookApi",
                ["Jwt:Audience"] = "BookApiUsers"
            })
            .Build();

    // ── Register ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_NewUsername_ReturnsCreatedUser()
    {
        using var db = CreateDb();
        var service = new AuthService(db, CreateConfig());

        var user = await service.Register("alice", "secret123");

        Assert.NotNull(user);
        Assert.Equal("alice", user.Username);
    }

    [Fact]
    public async Task Register_DuplicateUsername_ReturnsNull()
    {
        using var db = CreateDb();
        var service = new AuthService(db, CreateConfig());
        await service.Register("alice", "secret123");

        // Registering the same username a second time must fail gracefully
        var result = await service.Register("alice", "anotherpassword");

        Assert.Null(result);
    }

    [Fact]
    public async Task Register_PasswordIsHashed_NeverStoredAsPlainText()
    {
        using var db = CreateDb();
        var service = new AuthService(db, CreateConfig());
        const string plain = "mysecretpassword";

        await service.Register("alice", plain);

        var stored = db.Users.Single().PasswordHash;
        Assert.NotEqual(plain, stored);
        Assert.True(BCrypt.Net.BCrypt.Verify(plain, stored));
    }

    [Fact]
    public async Task Register_SavesUserToDatabase()
    {
        using var db = CreateDb();
        var service = new AuthService(db, CreateConfig());

        await service.Register("alice", "secret123");

        Assert.Equal(1, db.Users.Count());
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_CorrectCredentials_ReturnsUser()
    {
        using var db = CreateDb();
        var service = new AuthService(db, CreateConfig());
        await service.Register("alice", "secret123");

        var result = await service.Login("alice", "secret123");

        Assert.NotNull(result);
        Assert.Equal("alice", result.Username);
    }

    [Fact]
    public async Task Login_WrongPassword_ReturnsNull()
    {
        using var db = CreateDb();
        var service = new AuthService(db, CreateConfig());
        await service.Register("alice", "secret123");

        var result = await service.Login("alice", "wrongpassword");

        Assert.Null(result);
    }

    [Fact]
    public async Task Login_UserDoesNotExist_ReturnsNull()
    {
        using var db = CreateDb();
        var service = new AuthService(db, CreateConfig());

        var result = await service.Login("nobody", "secret123");

        Assert.Null(result);
    }

    // ── GenerateToken ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GenerateToken_ReturnsThreePartJwt()
    {
        using var db = CreateDb();
        var service = new AuthService(db, CreateConfig());
        var user = await service.Register("alice", "secret123");

        var token = service.GenerateToken(user!);

        // A valid JWT always has exactly three sections separated by dots
        Assert.Equal(3, token.Split('.').Length);
    }

    [Fact]
    public async Task GenerateToken_IsNotEmpty()
    {
        using var db = CreateDb();
        var service = new AuthService(db, CreateConfig());
        var user = await service.Register("alice", "secret123");

        var token = service.GenerateToken(user!);

        Assert.NotEmpty(token);
    }

    [Fact]
    public async Task GenerateToken_DifferentUsersProduceDifferentTokens()
    {
        using var db = CreateDb();
        var service = new AuthService(db, CreateConfig());
        var alice = await service.Register("alice", "pass1");
        var bob   = await service.Register("bob",   "pass2");

        var tokenA = service.GenerateToken(alice!);
        var tokenB = service.GenerateToken(bob!);

        Assert.NotEqual(tokenA, tokenB);
    }
}
