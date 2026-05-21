import { inject } from '@angular/core';          // inject() — modern DI inside a function
import { CanActivateFn, Router } from '@angular/router'; // CanActivateFn = type for a functional guard
import { AuthService } from '../services/auth.service';  // AuthService — has isLoggedIn signal

// A functional route guard — a plain function that returns true (allow) or a redirect (block)
// Angular calls this automatically before navigating to any route that uses it
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService); // Get AuthService via inject()
  const router      = inject(Router);      // Get Router so we can redirect if needed

  // Read the current value of the isLoggedIn signal
  // Signal values are read by calling them as a function: isLoggedIn()
  if (authService.isLoggedIn()) {
    return true; // User is logged in — allow navigation to the requested page
  }

  // User is NOT logged in — redirect to login page instead
  // router.createUrlTree(['/login']) creates a redirect instruction
  // Returning a UrlTree from a guard is the correct way to redirect (not router.navigate())
  return router.createUrlTree(['/login']);
};

/*
 * ===================== FILE EXPLANATION =====================
 * What this file is:
 *   A functional route guard — it runs before Angular navigates
 *   to a protected page and decides: allow or redirect?
 *
 * What is a Route Guard?
 *   A guard is a gatekeeper for a route.
 *   When a user tries to visit /books or /quotes, Angular checks
 *   the guard first. The guard returns:
 *   - true       → navigation proceeds, user sees the page
 *   - UrlTree    → navigation is cancelled and replaced with a redirect
 *
 * How it works step by step:
 *   1. User visits /books (or types it in the address bar)
 *   2. Angular sees that /books has canActivate: [authGuard]
 *   3. Angular calls authGuard() before loading the component
 *   4. authGuard reads isLoggedIn() signal from AuthService
 *   5a. If true  → BookListComponent loads normally
 *   5b. If false → user is redirected to /login instead
 *
 * Why return router.createUrlTree() instead of router.navigate()?
 *   Calling router.navigate() inside a guard creates a race condition
 *   — two navigations happening at once.
 *   Returning a UrlTree is the Angular-approved way: it tells the
 *   router "cancel this navigation and do this one instead" atomically.
 *
 * Why functional instead of class-based?
 *   Old Angular required a class implementing CanActivate interface.
 *   The new functional style (Angular 15+) is a plain function —
 *   simpler, no boilerplate, works with inject().
 *
 * Where is it used?
 *   app.routes.ts (Step 18) — applied to /books and /quotes routes.
 * ============================================================
 */
