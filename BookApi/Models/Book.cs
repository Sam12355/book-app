namespace BookApi.Models; // This file belongs to the "BookApi.Models" namespace

public class Book // Define a class called Book — this will become the "Books" table in the database
{
    public int Id { get; set; } // Primary Key — unique number for each book row (auto-assigned by EF)

    public string Title { get; set; } = string.Empty; // The book's title — default is "" so it's never null

    public string Author { get; set; } = string.Empty; // The book's author — default is "" so it's never null

    public DateOnly PublicationDate { get; set; } // The date the book was published (date only, no time needed)

    public int UserId { get; set; } // Foreign Key — the Id of the User who owns this book

    public User User { get; set; } = null!; // Navigation Property — lets EF load the full User object linked to this book
                                            // null! tells the compiler "trust me, EF will fill this in at runtime"
}

/*
 * ===================== FILE EXPLANATION =====================
 * What this file is:
 *   A model class that describes what a Book looks like in the database.
 *
 * What it does:
 *   Entity Framework reads this class and creates a "Books" table with columns:
 *   Id, Title, Author, PublicationDate, UserId.
 *
 * What is a Foreign Key (UserId)?
 *   It's a link to the Users table. Every book belongs to one user.
 *   If UserId = 3, it means "this book was created by the user with Id 3."
 *   This prevents users from seeing each other's books.
 *
 * What is a Navigation Property (User)?
 *   Instead of just storing the UserId number, this lets you write:
 *   book.User.Username — and get the actual user's name.
 *   Entity Framework handles the database JOIN for you behind the scenes.
 *
 * Who uses this file?
 *   AppDbContext (Step 4) to create the table.
 *   BooksController (Step 9) to read, create, update, and delete books.
 * ============================================================
 */
