using BookApi.Services; // Import AuthService so we can call Register, Login, GenerateToken
using Microsoft.AspNetCore.Mvc; // Import MVC attributes like [ApiController], [Route], [HttpPost]

namespace BookApi.Controllers; // This file belongs to the "BookApi.Controllers" namespace

[ApiController]          // Tells .NET this class is an API controller — enables automatic model validation and error responses
[Route("api/auth")]      // All endpoints in this controller are prefixed with /api/auth
public class AuthController : ControllerBase // Inherit from ControllerBase — gives us Ok(), BadRequest(), Unauthorized() etc.
{
    private readonly AuthService _authService; // The service that contains all auth logic

    // Constructor — AuthService is injected automatically by .NET's Dependency Injection system
    public AuthController(AuthService authService)
    {
        _authService = authService; // Store the reference for use in the endpoints below
    }

    // POST /api/auth/register
    // Receives a username + password and creates a new user account
    [HttpPost("register")] // This method handles HTTP POST requests to /api/auth/register
    public async Task<IActionResult> Register([FromBody] AuthRequest request) // [FromBody] reads the JSON body of the request
    {
        var user = await _authService.Register(request.Username, request.Password); // Try to register the user

        if (user == null) // null means the username was already taken
            return BadRequest("Username already exists."); // 400 Bad Request

        return Ok(); // 200 OK — no body needed, frontend shows its own success message
    }

    // POST /api/auth/login
    // Receives a username + password and returns a JWT token if credentials are valid
    [HttpPost("login")] // This method handles HTTP POST requests to /api/auth/login
    public async Task<IActionResult> Login([FromBody] AuthRequest request) // [FromBody] reads the JSON body of the request
    {
        var user = await _authService.Login(request.Username, request.Password); // Try to log in

        if (user == null) // null means wrong username or password
            return Unauthorized("Invalid username or password."); // 401 Unauthorized

        var token = _authService.GenerateToken(user); // Credentials valid — generate a JWT token

        return Ok(new { token }); // 200 OK — return the token as JSON: { "token": "eyJhbG..." }
    }
}

// A simple class that represents the JSON body sent by the frontend for both register and login
public class AuthRequest
{
    public string Username { get; set; } = string.Empty; // The username entered by the user
    public string Password { get; set; } = string.Empty; // The password entered by the user
}

/*
 * ===================== FILE EXPLANATION =====================
 * What this file is:
 *   The AuthController — it exposes two HTTP endpoints that the
 *   frontend (Angular) will call to register and log in users.
 *
 * What is a Controller?
 *   A controller is the "front door" of your API.
 *   It receives HTTP requests, calls the appropriate service,
 *   and sends back an HTTP response.
 *   It does NOT contain business logic — that lives in AuthService.
 *
 * The two endpoints:
 *
 *   POST /api/auth/register
 *   - Frontend sends: { "username": "john", "password": "abc123" }
 *   - Returns 400 if username is taken
 *   - Returns 200 "User registered successfully." if it worked
 *
 *   POST /api/auth/login
 *   - Frontend sends: { "username": "john", "password": "abc123" }
 *   - Returns 401 if credentials are wrong
 *   - Returns 200 { "token": "eyJhbG..." } if credentials are correct
 *
 * What is [ApiController]?
 *   A shortcut attribute that automatically:
 *   - Validates the request body (if Username is missing, returns 400 automatically)
 *   - Reads [FromBody] without you having to specify it every time
 *
 * What is [Route("api/auth")]?
 *   Sets the base URL for all endpoints in this controller.
 *   [HttpPost("register")] then adds "register" → full URL: /api/auth/register
 *   [HttpPost("login")]    then adds "login"    → full URL: /api/auth/login
 *
 * What is IActionResult?
 *   The return type for controller actions. It lets you return different
 *   HTTP status codes from the same method:
 *   - Ok()           → 200 (success)
 *   - BadRequest()   → 400 (client sent bad data)
 *   - Unauthorized() → 401 (not authenticated)
 *
 * What is AuthRequest?
 *   A simple class that maps to the JSON the frontend sends.
 *   When Angular sends { "username": "john", "password": "abc" },
 *   .NET automatically deserializes it into an AuthRequest object.
 *   This is called model binding.
 *
 * Who uses this file?
 *   The Angular frontend (Step 21-22) calls these endpoints.
 *   Program.cs wires it up via AddControllers() + MapControllers().
 * ============================================================
 */
