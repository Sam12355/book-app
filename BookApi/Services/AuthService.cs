using System.IdentityModel.Tokens.Jwt; // Provides JwtSecurityToken and JwtSecurityTokenHandler for building/reading tokens
using System.Security.Claims;           // Provides Claim and ClaimTypes — the pieces of info we put inside a token
using System.Text;                      // Provides Encoding — needed to convert our secret key string into bytes
using BookApi.Data;                     // Gives us access to AppDbContext (the database)
using BookApi.Models;                   // Gives us access to the User model class
using Microsoft.EntityFrameworkCore;    // Gives us async database methods like FirstOrDefaultAsync
using Microsoft.IdentityModel.Tokens;   // Provides SymmetricSecurityKey and SigningCredentials for signing tokens

namespace BookApi.Services; // This file belongs to the "BookApi.Services" namespace

public class AuthService // A service class — contains all the logic for registering, logging in, and creating tokens
{
    private readonly AppDbContext _context;        // The database — injected so we can query the Users table
    private readonly IConfiguration _config;       // App settings — injected so we can read the JWT key from appsettings.json

    // Constructor — receives AppDbContext and IConfiguration automatically via Dependency Injection
    public AuthService(AppDbContext context, IConfiguration config)
    {
        _context = context; // Store the database reference for use in methods below
        _config = config;   // Store the config reference for use in GenerateToken below
    }

    // Registers a new user — returns null if the username is already taken
    public async Task<User?> Register(string username, string password)
    {
        // Check if a user with this username already exists in the database
        bool userExists = await _context.Users.AnyAsync(u => u.Username == username);

        if (userExists) return null; // Username taken — return null to signal failure

        var user = new User // Create a new User object
        {
            Username = username,                              // Store the username as-is
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password) // Hash the password — NEVER store plain text
        };

        _context.Users.Add(user);        // Add the new user to the database (not saved yet)
        await _context.SaveChangesAsync(); // Commit the change — this actually writes to bookapi.db

        return user; // Return the newly created user
    }

    // Logs in a user — returns the User if credentials are correct, null if not
    public async Task<User?> Login(string username, string password)
    {
        // Find the user in the database by username (case-sensitive)
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);

        if (user == null) return null; // User not found — return null

        // Verify the entered password against the stored hash
        // BCrypt.Verify hashes the input and compares it to the stored hash — it never "unhashes"
        bool passwordCorrect = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);

        if (!passwordCorrect) return null; // Wrong password — return null

        return user; // Credentials valid — return the user so the controller can generate a token
    }

    // Generates a JWT token for a successfully logged-in user
    public string GenerateToken(User user)
    {
        // Read the secret key from appsettings.json and convert it to bytes
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));

        // Create signing credentials using HMAC-SHA256 — this signs the token so it can't be tampered with
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Claims are pieces of info packed inside the token that identify the user
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), // The user's Id — used to scope data per user
            new Claim(ClaimTypes.Name, user.Username)                  // The user's username — for display purposes
        };

        // Build the token with all its parts
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],       // Who created the token (our API)
            audience: _config["Jwt:Audience"],   // Who the token is intended for (our frontend users)
            claims: claims,                       // The user info packed inside
            expires: DateTime.UtcNow.AddHours(8), // Token expires after 8 hours — user must log in again after that
            signingCredentials: creds             // The signature that proves the token hasn't been tampered with
        );

        // Serialize the token object into a string like "eyJhbGci..." that we send to the frontend
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

/*
 * ===================== FILE EXPLANATION =====================
 * What this file is:
 *   The AuthService — it handles all authentication logic:
 *   registering new users, verifying login credentials, and
 *   generating JWT tokens.
 *
 * Why a separate service and not just put this in the controller?
 *   Controllers should only handle HTTP (receive request, send response).
 *   Business logic (like "how do we register a user?") lives in services.
 *   This keeps code clean, reusable, and easy to test.
 *
 * What is a JWT token?
 *   JWT = JSON Web Token. It's a small string (looks like "eyJhbG...")
 *   that the server gives to the user after login.
 *   It contains encoded information (claims) about who the user is.
 *   The user sends it back with every future request — so the server
 *   knows who is making the request without checking the database every time.
 *
 *   A JWT has 3 parts separated by dots:
 *   [Header].[Payload].[Signature]
 *   - Header:    algorithm used to sign it
 *   - Payload:   the claims (userId, username, expiry)
 *   - Signature: a cryptographic hash proving it hasn't been tampered with
 *
 * What is BCrypt?
 *   A one-way hashing algorithm for passwords. You can never reverse a hash
 *   back to the original password. To check a password, you hash it again
 *   and compare the two hashes. BCrypt also adds a random "salt" so two
 *   users with the same password get different hashes.
 *
 * What are Claims?
 *   Claims are key-value pairs of information about the user that are
 *   packed inside the JWT. Example: { "userId": "3", "username": "john" }.
 *   The backend reads these claims from the token to know who is calling.
 *   We use ClaimTypes.NameIdentifier to store the userId — this is the
 *   standard claim name .NET uses to identify a user.
 *
 * Who uses this file?
 *   AuthController (Step 7) calls Register(), Login(), and GenerateToken().
 *   Program.cs will register it as a service (we'll add that in Step 7).
 * ============================================================
 */
