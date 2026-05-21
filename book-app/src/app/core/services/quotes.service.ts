import { inject, Injectable } from '@angular/core';               // inject() = modern DI pattern
import { HttpClient } from '@angular/common/http';               // HttpClient — makes HTTP requests
import { Quote, QuoteRequest } from '../models/quote.model';     // Typed interfaces for Quote data
import { environment } from '../../../environments/environment'; // API base URL from environment file

@Injectable({ providedIn: 'root' }) // Singleton — one shared instance for the whole app
export class QuotesService {

  // ── Private dependencies ──────────────────────────────────────────────────
  private http = inject(HttpClient); // Used to call the .NET API

  // ── Private constants ─────────────────────────────────────────────────────
  private readonly apiUrl = `${environment.apiUrl}/quotes`; // e.g. http://localhost:5243/api/quotes

  // ── Get all quotes for the logged-in user ─────────────────────────────────
  // GET /api/quotes — returns Observable<Quote[]>
  getQuotes() {
    return this.http.get<Quote[]>(this.apiUrl); // Typed — TypeScript knows this returns Quote[]
  }

  // ── Create a new quote ────────────────────────────────────────────────────
  // POST /api/quotes — sends QuoteRequest, receives created Quote back
  createQuote(data: QuoteRequest) {
    return this.http.post<Quote>(this.apiUrl, data); // Returns the new quote with its id
  }

  // ── Update an existing quote ──────────────────────────────────────────────
  // PUT /api/quotes/:id — sends updated QuoteRequest, receives updated Quote back
  updateQuote(id: number, data: QuoteRequest) {
    return this.http.put<Quote>(`${this.apiUrl}/${id}`, data); // id in URL, data in body
  }

  // ── Delete a quote by Id ──────────────────────────────────────────────────
  // DELETE /api/quotes/:id — returns Observable<void> (204 No Content)
  deleteQuote(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`); // No response body expected
  }
}

/*
 * ===================== FILE EXPLANATION =====================
 * What this file is:
 *   The QuotesService — a thin wrapper around the Quotes API endpoints.
 *   Follows the exact same pattern as BooksService.
 *
 * Why is there no getQuote(id) method?
 *   The Quotes page shows all quotes on one screen and edits them
 *   inline — we never need to fetch a single quote by Id.
 *   Only add methods you actually need (YAGNI principle:
 *   "You Aren't Gonna Need It").
 *
 * Pattern summary — every service method:
 *   1. Calls the right HTTP verb + URL
 *   2. Uses a typed generic <T> so TypeScript knows the response shape
 *   3. Returns an Observable the component subscribes to
 *   4. Never touches the JWT token (the interceptor handles that)
 *
 * Who uses this file?
 *   QuotesComponent (Step 27) calls all four methods.
 * ============================================================
 */
