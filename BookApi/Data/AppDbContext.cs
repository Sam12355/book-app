using BookApi.Models;          // Import our model classes (User, Book, Quote) so we can reference them here
using Microsoft.EntityFrameworkCore; // Import Entity Framework Core so we can inherit from DbContext

namespace BookApi.Data; // This file belongs to the "BookApi.Data" namespace

public class AppDbContext : DbContext // AppDbContext inherits from DbContext — this gives us all EF database powers
{
    // Constructor — receives the database options (like which database to use) and passes them up to DbContext
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // DbSet = a handle to the Users table — use this to query, add, update, or delete users
    public DbSet<User> Users => Set<User>();

    // DbSet = a handle to the Books table — use this to query, add, update, or delete books
    public DbSet<Book> Books => Set<Book>();

    // DbSet = a handle to the Quotes table — use this to query, add, update, or delete quotes
    public DbSet<Quote> Quotes => Set<Quote>();
}

/*
 * ===================== FILE EXPLANATION =====================
 * What this file is:
 *   The DbContext — it is the single point of communication between
 *   your C# code and the SQLite database.
 *
 * Think of it like this:
 *   Your C# code speaks C#. The database speaks SQL.
 *   AppDbContext is the translator in the middle.
 *   You write: _context.Books.ToList()
 *   EF translates it to: SELECT * FROM Books
 *   And gives you back a C# List<Book>.
 *
 * What are DbSets?
 *   Each DbSet<T> maps to one table. You use them like C# lists:
 *   - _context.Books.ToList()         → get all books
 *   - _context.Books.Add(newBook)     → insert a book
 *   - _context.Books.Remove(book)     → delete a book
 *   - _context.SaveChangesAsync()     → commit changes to the DB
 *
 * How does it know which database to use?
 *   The options are passed in from Program.cs where we said:
 *   options.UseSqlite("Data Source=bookapi.db")
 *   AppDbContext itself doesn't care — it just uses whatever options it receives.
 *   This makes it easy to swap databases (e.g. SQLite → PostgreSQL) by
 *   changing one line in Program.cs.
 *
 * Who uses this file?
 *   Program.cs registers it via AddDbContext<AppDbContext>().
 *   AuthController, BooksController, QuotesController all receive it
 *   automatically via Dependency Injection.
 * ============================================================
 */
