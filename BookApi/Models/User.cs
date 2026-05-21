namespace BookApi.Models; // This file belongs to the "BookApi.Models" group (namespace = folder for organizing code)

public class User // Define a class called User — this will become the "Users" table in the database
{
    public int Id { get; set; } // Primary Key — a unique number that identifies each user row (auto-assigned by EF)

    public string Username { get; set; } = string.Empty; // The user's login name — default is "" so it's never null

    public string PasswordHash { get; set; } = string.Empty; // The scrambled (hashed) password — we NEVER store the real password
}

/*
 * ===================== FILE EXPLANATION =====================
 * What this file is:
 *   A "model" class that describes what a User looks like in the database.
 *
 * What it does:
 *   Entity Framework reads this class and creates a "Users" table with three columns:
 *   Id (auto number), Username (text), PasswordHash (text).
 *
 * Why PasswordHash and not Password?
 *   Storing plain passwords is dangerous. BCrypt scrambles the password into
 *   a random-looking string (hash). When a user logs in, we hash their input
 *   and compare it to the stored hash — we never store or compare plain text.
 *
 * Who uses this file?
 *   AppDbContext (Step 4) to create the table.
 *   AuthService (Step 6) to register and find users.
 * ============================================================
 */
