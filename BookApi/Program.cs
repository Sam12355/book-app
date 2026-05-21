using BookApi.Data;                                    // Import AppDbContext so we can register it below
using BookApi.Services;                               // Import AuthService so we can register it below
using Microsoft.AspNetCore.Authentication.JwtBearer;  // Import JWT Bearer so we can call AddJwtBearer()
using Microsoft.EntityFrameworkCore;                  // Import EF Core so we can call UseSqlite()
using Microsoft.IdentityModel.Tokens;                 // Import SymmetricSecurityKey and TokenValidationParameters
using System.Text;                                    // Import Encoding — needed to convert the secret key string to bytes

var builder = WebApplication.CreateBuilder(args); // Create the app builder — this sets up config, logging, and DI container

// On Render the PORT env var is set automatically; fall back to the dev port
var port = Environment.GetEnvironmentVariable("PORT") ?? "5243";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.Services.AddOpenApi();     // Register OpenAPI (auto-generates API documentation/test UI)
builder.Services.AddControllers(); // Register MVC Controllers — tells the app to look for Controller classes and map their routes

// Register AuthService so controllers can receive it via Dependency Injection
// AddScoped means one instance is created per HTTP request (not shared across requests)
builder.Services.AddScoped<AuthService>();

// Register AppDbContext as a service using Dependency Injection
// - AddDbContext makes EF Core available to any class that asks for AppDbContext
// - UseSqlite tells EF to use SQLite as the database engine
// - GetConnectionString reads "Data Source=bookapi.db" from appsettings.json
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Read the JWT secret key from configuration (appsettings.json or Jwt__Key env var on Render)
var jwtKey = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!);

// Register JWT Bearer authentication — this teaches the app how to validate incoming tokens
builder.Services.AddAuthentication(options =>
{
    // Set JWT Bearer as the default scheme — used when [Authorize] is applied to a controller
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    // Set JWT Bearer as the default challenge scheme — used when a request is rejected (sends 401)
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,                                          // Check that the token was created by our API
        ValidateAudience = true,                                        // Check that the token is intended for our users
        ValidateLifetime = true,                                        // Reject tokens that have expired
        ValidateIssuerSigningKey = true,                                // Verify the token's signature using our secret key
        ValidIssuer = builder.Configuration["Jwt:Issuer"],             // The expected issuer value ("BookApi")
        ValidAudience = builder.Configuration["Jwt:Audience"],         // The expected audience value ("BookApiUsers")
        IssuerSigningKey = new SymmetricSecurityKey(jwtKey)            // The secret key used to verify the signature
    };
});

// Register the Authorization service — required to use [Authorize] on controllers
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build(); // Build the app — everything registered above is now locked in and ready

// Run any pending migrations on startup so the database is ready in fresh environments (e.g. Render)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment()) // Only in development mode (not in production)
{
    app.MapOpenApi(); // Expose the OpenAPI endpoint so developers can browse the API docs
}

// HTTPS redirect is skipped on Render (the reverse proxy handles TLS termination)
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowAngular"); // MIDDLEWARE: apply the CORS policy — must come BEFORE authentication middleware
                              // This tells the browser: "yes, Angular at port 4200 is allowed to call us"

app.UseAuthentication(); // MIDDLEWARE: reads the JWT token from the request header and validates it
                         // Must come BEFORE UseAuthorization — order matters!

app.UseAuthorization();  // MIDDLEWARE: checks if the validated user has permission to access the endpoint
                         // If [Authorize] is on the controller and no valid token → returns 401

app.MapControllers(); // Wire up all controller routes — e.g. [Route("api/books")] becomes a real URL

app.Run(); // Start the web server and begin listening for incoming HTTP requests

/*
 * ===================== FILE EXPLANATION =====================
 * What this file is:
 *   The entry point of the entire .NET application.
 *   It is the first file that runs when you type "dotnet run".
 *
 * It has two jobs:
 *   1. REGISTER services (the builder section at the top)
 *      Think of this like a setup checklist before opening a restaurant.
 *      You register the database, authentication, controllers, etc.
 *      Nothing runs yet — you're just telling .NET what will be available.
 *
 *   2. CONFIGURE the request pipeline (the app section at the bottom)
 *      This is the ORDER in which incoming HTTP requests are processed.
 *      Each app.Use___() call adds a "middleware" step in sequence.
 *      ORDER MATTERS — middleware runs top to bottom.
 *
 * Full middleware pipeline after Step 11:
 *
 *   Request arrives
 *       → UseHttpsRedirection   (upgrade HTTP to HTTPS)
 *       → UseCors               (check the request comes from an allowed origin)
 *       → UseAuthentication     (read + validate the JWT token)
 *       → UseAuthorization      (check if user has access to this route)
 *       → MapControllers        (hand off to the right controller method)
 *
 * What is CORS?
 *   Browsers have a security rule: a webpage can only call APIs on the
 *   SAME origin (domain + port) as itself. This is called the Same-Origin Policy.
 *   Angular runs on localhost:4200. Our API runs on localhost:5000+.
 *   Different ports = different origins = browser blocks the request by default.
 *   CORS is the API's way of saying "I trust this other origin, let it through."
 *
 * What does [Authorize] do on a controller?
 *   It tells UseAuthorization: "only allow requests that have a valid token."
 *   If the token is missing or invalid → 401 Unauthorized automatically.
 *   If the token is valid → the request proceeds to the controller method.
 * ============================================================
 */
