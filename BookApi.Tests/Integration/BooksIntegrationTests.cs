using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace BookApi.Tests.Integration;

public class BooksIntegrationTests : IClassFixture<BookApiFactory>
{
    private readonly HttpClient _client;

    public BooksIntegrationTests(BookApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    // Registers a user, logs in, and returns the JWT token
    private async Task<string> GetTokenAsync(string username = "testuser", string password = "password123")
    {
        await _client.PostAsJsonAsync("/api/auth/register", new { username, password });
        var response = await _client.PostAsJsonAsync("/api/auth/login", new { username, password });
        var body = await response.Content.ReadFromJsonAsync<TokenResponse>();
        return body!.Token;
    }

    // ── Auth protection ───────────────────────────────────────────────────────

    [Fact]
    public async Task GetBooks_WithoutToken_Returns401()
    {
        var response = await _client.GetAsync("/api/books");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateBook_WithoutToken_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/books", new
        {
            title = "Test",
            author = "Author",
            publicationDate = "2020-01-01"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── CRUD with a valid token ───────────────────────────────────────────────

    [Fact]
    public async Task GetBooks_WithValidToken_ReturnsEmptyListForNewUser()
    {
        var token = await GetTokenAsync("newuser1");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/books");
        var books = await response.Content.ReadFromJsonAsync<List<BookResponse>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Empty(books!);
    }

    [Fact]
    public async Task CreateBook_WithValidToken_Returns201AndBookAppearsInList()
    {
        var token = await GetTokenAsync("newuser2");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var create = await _client.PostAsJsonAsync("/api/books", new
        {
            title = "Clean Code",
            author = "Robert Martin",
            publicationDate = "2008-08-01"
        });

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);

        var books = await _client.GetFromJsonAsync<List<BookResponse>>("/api/books");
        Assert.Single(books!);
        Assert.Equal("Clean Code", books![0].Title);
    }

    [Fact]
    public async Task DeleteBook_OwnBook_Returns204()
    {
        var token = await GetTokenAsync("newuser3");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var created = await _client.PostAsJsonAsync("/api/books", new
        {
            title = "To Delete",
            author = "Author",
            publicationDate = "2020-01-01"
        });

        var book = await created.Content.ReadFromJsonAsync<BookResponse>();

        var delete = await _client.DeleteAsync($"/api/books/{book!.Id}");

        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
    }

    [Fact]
    public async Task GetBooks_OnlyReturnsCurrentUsersBooks()
    {
        var token1 = await GetTokenAsync("userA");
        var token2 = await GetTokenAsync("userB");

        // userA creates a book
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);
        await _client.PostAsJsonAsync("/api/books", new
        {
            title = "UserA Book",
            author = "A",
            publicationDate = "2020-01-01"
        });

        // userB should see an empty list
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);
        var books = await _client.GetFromJsonAsync<List<BookResponse>>("/api/books");

        Assert.Empty(books!);
    }

    private record TokenResponse(string Token);
    private record BookResponse(int Id, string Title, string Author);
}
