using BookApi.Data;                       // Import AppDbContext to access the Quotes table
using BookApi.Models;                     // Import the Quote model class
using Microsoft.AspNetCore.Authorization; // Import [Authorize] attribute
using Microsoft.AspNetCore.Mvc;           // Import [ApiController], [Route], IActionResult etc.
using Microsoft.EntityFrameworkCore;      // Import async EF methods like ToListAsync, FirstOrDefaultAsync
using System.Security.Claims;             // Import ClaimTypes to read the userId from the JWT token

namespace BookApi.Controllers; // This file belongs to the "BookApi.Controllers" namespace

[Authorize]              // Every endpoint requires a valid JWT token — no token = 401 automatically
[ApiController]          // Marks this as an API controller — enables automatic validation and model binding
[Route("api/quotes")]    // All endpoints in this controller are prefixed with /api/quotes
public class QuotesController : ControllerBase // Inherit ControllerBase for Ok(), NotFound(), NoContent() etc.
{
    private readonly AppDbContext _context; // The database — injected via Dependency Injection

    // Constructor — AppDbContext is automatically provided by .NET's DI system
    public QuotesController(AppDbContext context)
    {
        _context = context; // Store the database reference for use in the methods below
    }

    // Helper: reads the logged-in user's Id from the JWT token claims
    // Same helper as in BooksController — reads the NameIdentifier claim we set in AuthService
    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET /api/quotes
    // Returns all quotes that belong to the currently logged-in user
    [HttpGet]
    public async Task<IActionResult> GetQuotes()
    {
        var userId = GetUserId(); // Get the logged-in user's Id from the token

        // Query only quotes that belong to this user
        var quotes = await _context.Quotes
            .Where(q => q.UserId == userId) // Filter by owner — users only see their own quotes
            .ToListAsync();                 // Execute the query and return a List<Quote>

        return Ok(quotes); // 200 OK — return the list as JSON
    }

    // GET /api/quotes/{id}
    // Returns a single quote by its Id — only if it belongs to the logged-in user
    [HttpGet("{id}")]
    public async Task<IActionResult> GetQuote(int id) // {id} in the route maps to this parameter
    {
        var userId = GetUserId(); // Get the logged-in user's Id from the token

        // Find the quote by Id AND UserId — prevents users accessing each other's quotes
        var quote = await _context.Quotes
            .FirstOrDefaultAsync(q => q.Id == id && q.UserId == userId);

        if (quote == null) return NotFound(); // 404 — quote not found or doesn't belong to this user

        return Ok(quote); // 200 OK — return the quote as JSON
    }

    // POST /api/quotes
    // Creates a new quote for the logged-in user
    [HttpPost]
    public async Task<IActionResult> CreateQuote([FromBody] QuoteRequest request) // [FromBody] reads the JSON request body
    {
        var userId = GetUserId(); // Get the logged-in user's Id from the token

        var quote = new Quote // Build a new Quote object from the request data
        {
            Text = request.Text, // From the request body
            UserId = userId      // Automatically set to the logged-in user — never trusted from the request
        };

        _context.Quotes.Add(quote);        // Stage the new quote for insertion
        await _context.SaveChangesAsync(); // Commit to the database — this writes the row

        // 201 Created — return the new quote and a Location header pointing to GET /api/quotes/{id}
        return CreatedAtAction(nameof(GetQuote), new { id = quote.Id }, quote);
    }

    // PUT /api/quotes/{id}
    // Updates an existing quote — only if it belongs to the logged-in user
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateQuote(int id, [FromBody] QuoteRequest request)
    {
        var userId = GetUserId(); // Get the logged-in user's Id from the token

        // Find the existing quote — must belong to the logged-in user
        var quote = await _context.Quotes
            .FirstOrDefaultAsync(q => q.Id == id && q.UserId == userId);

        if (quote == null) return NotFound(); // 404 — quote not found or not owned by this user

        quote.Text = request.Text; // Update the text with the new value from the request

        await _context.SaveChangesAsync(); // Commit the change to the database

        return Ok(quote); // 200 OK — return the updated quote as JSON
    }

    // DELETE /api/quotes/{id}
    // Deletes a quote — only if it belongs to the logged-in user
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteQuote(int id)
    {
        var userId = GetUserId(); // Get the logged-in user's Id from the token

        // Find the quote — must belong to the logged-in user
        var quote = await _context.Quotes
            .FirstOrDefaultAsync(q => q.Id == id && q.UserId == userId);

        if (quote == null) return NotFound(); // 404 — quote not found or not owned by this user

        _context.Quotes.Remove(quote);     // Stage the quote for deletion
        await _context.SaveChangesAsync(); // Commit — this permanently deletes the row

        return NoContent(); // 204 No Content — success, nothing to return
    }
}

// Represents the JSON body sent by the frontend when creating or updating a quote
public class QuoteRequest
{
    public string Text { get; set; } = string.Empty; // The text of the quote
}

/*
 * ===================== FILE EXPLANATION =====================
 * What this file is:
 *   The QuotesController — exposes 5 HTTP endpoints for full CRUD
 *   operations on quotes. Follows the exact same pattern as BooksController.
 *
 * CRUD mapped to HTTP verbs:
 *   GET    /api/quotes       → Read all quotes   (the R in CRUD)
 *   GET    /api/quotes/{id}  → Read one quote    (the R in CRUD)
 *   POST   /api/quotes       → Create a quote    (the C in CRUD)
 *   PUT    /api/quotes/{id}  → Update a quote    (the U in CRUD)
 *   DELETE /api/quotes/{id}  → Delete a quote    (the D in CRUD)
 *
 * Why is this simpler than BooksController?
 *   A Quote only has one field (Text) vs Book's three fields
 *   (Title, Author, PublicationDate). The structure and security
 *   logic is identical — only the data shape is simpler.
 *
 * What is the same as BooksController?
 *   - [Authorize] protects all endpoints
 *   - GetUserId() reads the userId from the JWT token
 *   - Every query filters by UserId for security
 *   - Same HTTP status codes: 200, 201, 204, 404
 *
 * This is the power of patterns in programming:
 *   Once you understand the CRUD pattern from BooksController,
 *   you can apply it to ANY resource (quotes, reviews, products,
 *   orders...) just by swapping the model and fields.
 *
 * Who uses this file?
 *   The Angular frontend (Step 27) calls these endpoints
 *   to manage the My Quotes page.
 * ============================================================
 */
