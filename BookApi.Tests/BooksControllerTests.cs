using System.Security.Claims;
using BookApi.Controllers;
using BookApi.Data;
using BookApi.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookApi.Tests;

public class BooksControllerTests
{
    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    // Attaches a fake authenticated identity to the controller so GetUserId() works in tests
    private static void SetUser(ControllerBase controller, int userId)
    {
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }

    // Helper: casts an IActionResult to OkObjectResult and returns the typed value
    private static T GetOkValue<T>(IActionResult result)
    {
        var ok = Assert.IsType<OkObjectResult>(result);
        return Assert.IsType<T>(ok.Value);
    }

    // ── GetBooks ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetBooks_ReturnsOnlyBooksForLoggedInUser()
    {
        using var db = CreateDb();
        db.Users.AddRange(
            new User { Id = 1, Username = "alice", PasswordHash = "x" },
            new User { Id = 2, Username = "bob",   PasswordHash = "x" }
        );
        db.Books.AddRange(
            new Book { Title = "Alice Book", Author = "A", PublicationDate = new DateOnly(2020, 1, 1), UserId = 1 },
            new Book { Title = "Bob Book",   Author = "B", PublicationDate = new DateOnly(2021, 1, 1), UserId = 2 }
        );
        await db.SaveChangesAsync();

        var controller = new BooksController(db);
        SetUser(controller, userId: 1);

        var result = await controller.GetBooks();
        var books = GetOkValue<List<Book>>(result);

        Assert.Single(books);
        Assert.Equal("Alice Book", books[0].Title);
    }

    [Fact]
    public async Task GetBooks_WhenNoBooksExist_ReturnsEmptyList()
    {
        using var db = CreateDb();
        db.Users.Add(new User { Id = 1, Username = "alice", PasswordHash = "x" });
        await db.SaveChangesAsync();

        var controller = new BooksController(db);
        SetUser(controller, userId: 1);

        var result = await controller.GetBooks();
        var books = GetOkValue<List<Book>>(result);

        Assert.Empty(books);
    }

    // ── CreateBook ────────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateBook_ValidRequest_Returns201AndSavesToDb()
    {
        using var db = CreateDb();
        db.Users.Add(new User { Id = 1, Username = "alice", PasswordHash = "x" });
        await db.SaveChangesAsync();

        var controller = new BooksController(db);
        SetUser(controller, userId: 1);

        var result = await controller.CreateBook(new BookRequest
        {
            Title           = "Clean Code",
            Author          = "Robert Martin",
            PublicationDate = new DateOnly(2008, 8, 1)
        });

        var created = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(201, created.StatusCode);
        Assert.Equal(1, db.Books.Count());
    }

    [Fact]
    public async Task CreateBook_SetsUserIdFromToken_NotFromRequest()
    {
        using var db = CreateDb();
        db.Users.Add(new User { Id = 1, Username = "alice", PasswordHash = "x" });
        await db.SaveChangesAsync();

        var controller = new BooksController(db);
        SetUser(controller, userId: 1);

        await controller.CreateBook(new BookRequest
        {
            Title           = "My Book",
            Author          = "Me",
            PublicationDate = new DateOnly(2020, 1, 1)
        });

        // The saved book's UserId must come from the JWT claim, not a user-supplied field
        Assert.Equal(1, db.Books.Single().UserId);
    }

    // ── DeleteBook ────────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteBook_OwnBook_Returns204AndRemovesFromDb()
    {
        using var db = CreateDb();
        db.Users.Add(new User { Id = 1, Username = "alice", PasswordHash = "x" });
        db.Books.Add(new Book { Id = 10, Title = "My Book", Author = "Me", PublicationDate = new DateOnly(2020, 1, 1), UserId = 1 });
        await db.SaveChangesAsync();

        var controller = new BooksController(db);
        SetUser(controller, userId: 1);

        var result = await controller.DeleteBook(10);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(0, db.Books.Count());
    }

    [Fact]
    public async Task DeleteBook_AnotherUsersBook_Returns404AndLeavesDbUnchanged()
    {
        using var db = CreateDb();
        db.Users.AddRange(
            new User { Id = 1, Username = "alice", PasswordHash = "x" },
            new User { Id = 2, Username = "bob",   PasswordHash = "x" }
        );
        db.Books.Add(new Book { Id = 10, Title = "Bob Book", Author = "Bob", PublicationDate = new DateOnly(2020, 1, 1), UserId = 2 });
        await db.SaveChangesAsync();

        var controller = new BooksController(db);
        SetUser(controller, userId: 1); // Alice tries to delete Bob's book

        var result = await controller.DeleteBook(10);

        Assert.IsType<NotFoundResult>(result);
        Assert.Equal(1, db.Books.Count()); // Book must still be in the database
    }

    // ── UpdateBook ────────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateBook_OwnBook_UpdatesFieldsInDb()
    {
        using var db = CreateDb();
        db.Users.Add(new User { Id = 1, Username = "alice", PasswordHash = "x" });
        db.Books.Add(new Book { Id = 5, Title = "Old Title", Author = "Old Author", PublicationDate = new DateOnly(2000, 1, 1), UserId = 1 });
        await db.SaveChangesAsync();

        var controller = new BooksController(db);
        SetUser(controller, userId: 1);

        await controller.UpdateBook(5, new BookRequest
        {
            Title           = "New Title",
            Author          = "New Author",
            PublicationDate = new DateOnly(2024, 6, 1)
        });

        var updated = db.Books.Single();
        Assert.Equal("New Title", updated.Title);
        Assert.Equal("New Author", updated.Author);
    }
}
