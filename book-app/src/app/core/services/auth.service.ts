import { inject, Injectable, signal } from '@angular/core';      // inject() = modern DI, signal() = reactive state
import { HttpClient } from '@angular/common/http';               // HttpClient — makes HTTP requests
import { Router } from '@angular/router';                        // Router — navigates between pages programmatically
import { tap } from 'rxjs';                                      // tap() — runs a side effect inside an Observable stream
import { AuthRequest, AuthResponse } from '../models/auth.model'; // Our typed request/response interfaces
import { environment } from '../../../environments/environment';  // API base URL from environment file

@Injectable({ providedIn: 'root' }) // providedIn: 'root' = one shared instance for the whole app (singleton)
export class AuthService {

  // ── Private dependencies (injected with the modern inject() function) ──
  private http   = inject(HttpClient); // Used to call the .NET API
  private router = inject(Router);     // Used to redirect after login/logout

  // ── Private constants ──
  private readonly apiUrl    = `${environment.apiUrl}/auth`; // e.g. http://localhost:5243/api/auth
  private readonly tokenKey  = 'auth_token';                 // Key used to store the token in localStorage

  // ── Public signal: reactive login state ──────────────────────────────────
  // signal() is Angular's modern reactive primitive — like a variable that
  // automatically updates anything that reads it when its value changes.
  // Components that read isLoggedIn() will re-render automatically on change.
  isLoggedIn = signal<boolean>(this.hasToken()); // Initialise from localStorage on app start

  // ── Register a new user ──────────────────────────────────────────────────
  // Sends POST /api/auth/register — returns an Observable the caller subscribes to
  register(data: AuthRequest) {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  // ── Log in — calls the API and saves the token on success ────────────────
  // tap() is a side-effect operator: it runs saveToken() when the response arrives
  // without changing the response itself, then passes it downstream
  login(data: AuthRequest) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(response => this.saveToken(response.token)) // On success: save token + update signal
    );
  }

  // ── Save the token and update the login state signal ─────────────────────
  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token); // Persist token across page refreshes
    this.isLoggedIn.set(true);                  // Update the signal — navbar re-renders instantly
  }

  // ── Read the token from localStorage ─────────────────────────────────────
  // Called by the HTTP interceptor to attach the token to every API request
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey); // Returns the token string, or null if not logged in
  }

  // ── Log out — clear token and redirect to login ──────────────────────────
  logout(): void {
    localStorage.removeItem(this.tokenKey); // Delete the token from storage
    this.isLoggedIn.set(false);             // Update the signal — navbar re-renders instantly
    this.router.navigate(['/login']);        // Redirect to the login page
  }

  // ── Private helper: checks if a token exists in localStorage ─────────────
  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey); // !! converts string|null to true|false
  }
}

/*
 * ===================== FILE EXPLANATION =====================
 * What this file is:
 *   The AuthService — the single source of truth for authentication
 *   state in the Angular app. It manages the JWT token lifecycle:
 *   register, login, store, read, and logout.
 *
 * Key concepts:
 *
 *   inject() instead of constructor injection:
 *     Old way: constructor(private http: HttpClient) {}
 *     New way: private http = inject(HttpClient);
 *     Same result, cleaner syntax — the Angular team recommends this.
 *
 *   signal<boolean>():
 *     A signal is a reactive value. When isLoggedIn changes (set to
 *     true or false), any component that reads it automatically
 *     re-renders. The navbar uses this to show/hide the Logout button
 *     without any manual change detection.
 *
 *   Observable + tap():
 *     HttpClient methods return Observables — lazy streams of data.
 *     Nothing happens until a component calls .subscribe().
 *     tap() lets us run a side effect (save the token) inside the
 *     stream without consuming it — the component still gets the response.
 *
 *   providedIn: 'root':
 *     Makes this service a singleton — one instance shared by all
 *     components. This is important: we want one central isLoggedIn
 *     signal, not one per component.
 *
 *   localStorage:
 *     Browser storage that persists across page refreshes and tabs.
 *     The token lives here so the user stays logged in after refreshing.
 *
 * Who uses this file?
 *   LoginComponent (Step 21) calls login()
 *   RegisterComponent (Step 22) calls register()
 *   AuthInterceptor (Step 16) calls getToken()
 *   AuthGuard (Step 17) reads isLoggedIn()
 *   NavbarComponent (Step 19) reads isLoggedIn() and calls logout()
 * ============================================================
 */
