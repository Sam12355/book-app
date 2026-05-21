namespace BookApi.Models; // This file belongs to the "BookApi.Models" namespace

public class Quote // Define a class called Quote — this will become the "Quotes" table in the database
{
    public int Id { get; set; } // Primary Key — unique number for each quote row (auto-assigned by EF)

    public string Text { get; set; } = string.Empty; // The text of the quote — default is "" so it's never null

    public int UserId { get; set; } // Foreign Key — the Id of the User who owns this quote

    public User User { get; set; } = null!; // Navigation Property — lets EF load the full User object linked to this quote
                                            // null! tells the compiler "trust me, EF will fill this in at runtime"
}

/*
 * ===================== FILE EXPLANATION =====================
 * What this file is:
 *   A model class that describes what a Quote looks like in the database.
 *
 * What it does:
 *   Entity Framework reads this class and creates a "Quotes" table with columns:
 *   Id, Text, UserId.
 *
 * Why is it simpler than Book?
 *   A quote only needs the text itself and an owner (UserId).
 *   No extra fields like publication date are needed.
 *
 * What is the relationship with User?
 *   Same as Book — every quote belongs to one user via UserId.
 *   This means only the logged-in user can see, edit, or delete their own quotes.
 *
 * Who uses this file?
 *   AppDbContext (Step 4) to create the table.
 *   QuotesController (Step 10) to read, create, update, and delete quotes.
 * ============================================================
 */
