using System.Net;
using System.Net.Http.Json;

namespace BookApi.Tests.Integration;

public class AuthIntegrationTests : IClassFixture<BookApiFactory>
{
    private readonly HttpClient _client;

    public AuthIntegrationTests(BookApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    // ── Register ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Register_WithValidCredentials_Returns200()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            username = "alice",
            password = "password123"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Register_WithDuplicateUsername_ReturnsBadRequest()
    {
        var payload = new { username = "bob", password = "password123" };

        await _client.PostAsJsonAsync("/api/auth/register", payload);
        var second = await _client.PostAsJsonAsync("/api/auth/register", payload);

        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        var payload = new { username = "charlie", password = "password123" };
        await _client.PostAsJsonAsync("/api/auth/register", payload);

        var response = await _client.PostAsJsonAsync("/api/auth/login", payload);
        var body = await response.Content.ReadFromJsonAsync<TokenResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.False(string.IsNullOrEmpty(body?.Token));
    }

    [Fact]
    public async Task Login_WithWrongPassword_Returns401()
    {
        await _client.PostAsJsonAsync("/api/auth/register", new
        {
            username = "dave",
            password = "correctpassword"
        });

        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            username = "dave",
            password = "wrongpassword"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithUnknownUsername_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            username = "nobody",
            password = "password123"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // Helper record to deserialise the login response body
    private record TokenResponse(string Token);
}
