import { HttpInterceptorFn } from '@angular/common/http'; // The type for a functional interceptor
import { inject } from '@angular/core';                   // inject() — modern DI inside a function
import { AuthService } from '../services/auth.service';  // AuthService — provides getToken()

// A functional interceptor — a plain function, not a class (Angular best practice since v15)
// It runs automatically before EVERY HTTP request made anywhere in the app
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // req  = the outgoing HTTP request (read-only — we clone it to modify)
  // next = the next handler in the chain — calling next(req) sends the request onwards

  const authService = inject(AuthService); // Get the AuthService via inject() — works inside functions too
  const token = authService.getToken();    // Read the JWT token from localStorage (null if not logged in)

  // If there is no token (user not logged in), pass the request through unchanged
  // This covers public endpoints like /api/auth/login and /api/auth/register
  if (!token) {
    return next(req); // Send the original request as-is
  }

  // Clone the request and add the Authorization header with the Bearer token
  // We MUST clone because HttpRequest objects are immutable (read-only by design)
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}` // Standard JWT header format: "Bearer eyJhbG..."
    }
  });

  return next(authReq); // Send the cloned request (with the token attached) onwards
};

/*
 * ===================== FILE EXPLANATION =====================
 * What this file is:
 *   A functional HTTP interceptor — it sits between every HttpClient
 *   call and the network, automatically attaching the JWT token.
 *
 * What is an Interceptor?
 *   Think of it like airport security on the way OUT.
 *   Every outgoing HTTP request passes through here before being sent.
 *   We can inspect it, modify it, block it, or log it.
 *   The key use case: attach the Authorization header so every
 *   service (BooksService, QuotesService) doesn't need to do it manually.
 *
 * Why is HttpRequest immutable?
 *   Angular makes requests read-only to prevent accidental mutation.
 *   The correct pattern is always: clone it → modify the clone → send the clone.
 *   req.clone({ setHeaders: {...} }) creates a copy with the new header merged in.
 *
 * Why functional instead of class-based?
 *   Old Angular used a class that implemented HttpInterceptor interface.
 *   The new functional style is simpler — just a function.
 *   It works with the new inject() API and is tree-shakable.
 *
 * What is the Bearer scheme?
 *   "Bearer" is the standard token type for JWT authentication (RFC 6750).
 *   The format is always: Authorization: Bearer <token>
 *   The server's UseAuthentication middleware reads this header,
 *   strips "Bearer ", and validates the remaining token string.
 *
 * What about the login and register requests?
 *   They go to /api/auth/* — no token exists yet at that point.
 *   getToken() returns null → the if (!token) check lets them
 *   pass through without an Authorization header. This is correct.
 *
 * Who uses this file?
 *   app.config.ts — registered there with withInterceptors([authInterceptor])
 *   After that, it runs silently on every HTTP request automatically.
 * ============================================================
 */
