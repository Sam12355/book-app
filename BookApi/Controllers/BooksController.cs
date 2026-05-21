using BookApi.Data;                  // Import AppDbContext to access the Books table
using BookApi.Models;                // Import the Book model class
using Microsoft.AspNetCore.Authorization; // Import [Authorize] attribute
using Microsoft.AspNetCore.Mvc;      // Import [ApiController], [Route], IActionResult etc.
using Microsoft.EntityFrameworkCore; // Import async EF methods like ToListAsync, FindAsync
using System.Security.Claims;        // Import ClaimTypes so we can read the userId from the JWT token

namespace BookApi.Controllers; // This file belongs to the "BookApi.Controllers" namespace

[Authorize]              // Every endpoint in this controller requires a valid JWT token — no token = 401
[ApiController]          // Marks this as an API controller — enables automatic validation and model binding
[Route("api/books")]     // All endpoints are prefixed with /api/books
public class BooksController : ControllerBase // Inherit ControllerBase for Ok(), NotFound(), BadRequest() etc.
{
    private readonly AppDbContext _context; // The database — injected via Dependency Injection

    // Constructor — AppDbContext is automatically injected by .NET
    public BooksController(AppDbContext context)
    {
        _context = context; // Store the database reference for use in methods below
    }

    // Helper: reads the logged-in user's Id from the JWT token claims
    // ClaimTypes.NameIdentifier is where we stored the userId when generating the token in AuthService
    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET /api/books
    // Returns all books that belong to the currently logged-in user
    [HttpGet]
    public async Task<IActionResult> GetBooks()
    {
        var userId = GetUserId(); // Get the logged-in user's Id from the token

        // Query the database — only return books where UserId matches the logged-in user
        var books = await _context.Books
            .Where(b => b.UserId == userId)   // Filter: only this user's books
            .ToListAsync();                    // Execute the query and return a List<Book>

        return Ok(books); // 200 OK — return the list as JSON
    }

    // GET /api/books/{id}
    // Returns a single book by its Id — only if it belongs to the logged-in user
    [HttpGet("{id}")]
    public async Task<IActionResult> GetBook(int id) // {id} in the route maps to this parameter
    {
        var userId = GetUserId(); // Get the logged-in user's Id from the token

        // Find the book by Id AND UserId — prevents users from accessing each other's books
        var book = await _context.Books
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

        if (book == null) return NotFound(); // 404 — book doesn't exist or doesn't belong to this user

        return Ok(book); // 200 OK — return the book as JSON
    }

    // POST /api/books
    // Creates a new book for the logged-in user
    [HttpPost]
    public async Task<IActionResult> CreateBook([FromBody] BookRequest request) // [FromBody] reads the JSON request body
    {
        var userId = GetUserId(); // Get the logged-in user's Id from the token

        var book = new Book // Build a new Book object from the request data
        {
            Title = request.Title,                  // From the request body
            Author = request.Author,                // From the request body
            PublicationDate = request.PublicationDate, // From the request body
            UserId = userId                         // Automatically set to the logged-in user — not from the request
        };

        _context.Books.Add(book);          // Stage the new book for insertion
        await _context.SaveChangesAsync(); // Commit to the database — this writes the row

        // 201 Created — return the new book and a Location header pointing to GET /api/books/{id}
        return CreatedAtAction(nameof(GetBook), new { id = book.Id }, book);
    }

    // PUT /api/books/{id}
    // Updates an existing book — only if it belongs to the logged-in user
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBook(int id, [FromBody] BookRequest request)
    {
        var userId = GetUserId(); // Get the logged-in user's Id from the token

        // Find the existing book — must belong to the logged-in user
        var book = await _context.Books
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

        if (book == null) return NotFound(); // 404 — book not found or not owned by this user

        // Update the book's fields with the new values from the request
        book.Title = request.Title;
        book.Author = request.Author;
        book.PublicationDate = request.PublicationDate;
        // Note: we do NOT update UserId — a book cannot be transferred to another user

        await _context.SaveChangesAsync(); // Commit the changes to the database

        return Ok(book); // 200 OK — return the updated book as JSON
    }

    // DELETE /api/books/{id}
    // Deletes a book — only if it belongs to the logged-in user
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBook(int id)
    {
        var userId = GetUserId(); // Get the logged-in user's Id from the token

        // Find the book — must belong to the logged-in user
        var book = await _context.Books
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

        if (book == null) return NotFound(); // 404 — book not found or not owned by this user

        _context.Books.Remove(book);       // Stage the book for deletion
        await _context.SaveChangesAsync(); // Commit — this permanently deletes the row

        return NoContent(); // 204 No Content — success, nothing to return
    }
}

// Represents the JSON body sent by the frontend when creating or updating a book
public class BookRequest
{
    public string Title { get; set; } = string.Empty;           // The book's title
    public string Author { get; set; } = string.Empty;          // The book's author
    public DateOnly PublicationDate { get; set; }               // The book's publication date
}

/*
 * ===================== FILE EXPLANATION =====================
 * What this file is:
 *   The BooksController — exposes 5 HTTP endpoints for full CRUD
 *   (Create, Read, Update, Delete) operations on books.
 *
 * CRUD mapped to HTTP verbs:
 *   GET    /api/books       → Read all books    (the R in CRUD)
 *   GET    /api/books/{id}  → Read one book     (the R in CRUD)
 *   POST   /api/books       → Create a book     (the C in CRUD)
 *   PUT    /api/books/{id}  → Update a book     (the U in CRUD)
 *   DELETE /api/books/{id}  → Delete a book     (the D in CRUD)
 *
 * What does [Authorize] do here?
 *   Every endpoint in this controller is protected.
 *   If a request arrives without a valid JWT token in the header,
 *   the middleware rejects it with 401 before it even enters a method.
 *
 * How does the API know which user is logged in?
 *   The JWT token contains "claims" — small pieces of info we packed
 *   in during login. GetUserId() reads the NameIdentifier claim
 *   (which we set to user.Id in AuthService.GenerateToken).
 *   This means every book operation is automatically scoped to the
 *   correct user — no user can touch another user's books.
 *
 * Why do we always filter by UserId?
 *   Security. Without the UserId filter, user A could call
 *   DELETE /api/books/5 and delete user B's book.
 *   By always checking b.UserId == userId, that's impossible.
 *
 * What is CreatedAtAction?
 *   A special 201 response for POST that also includes a
 *   Location header pointing to where the new resource lives.
 *   Example: Location: /api/books/7
 *   This is the REST standard for "here's what you just created and where to find it."
 *
 * What is NoContent (204)?
 *   The standard response for a successful DELETE — success, but
 *   there's nothing to return because the item no longer exists.
 *
 * Who uses this file?
 *   The Angular frontend (Steps 23-26) calls these endpoints.
 * ============================================================
 */
