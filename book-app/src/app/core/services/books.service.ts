import { inject, Injectable } from '@angular/core';             // inject() = modern DI pattern
import { HttpClient } from '@angular/common/http';             // HttpClient — makes HTTP requests
import { Book, BookRequest } from '../models/book.model';      // Typed interfaces for Book data
import { environment } from '../../../environments/environment'; // API base URL from environment file

@Injectable({ providedIn: 'root' }) // Singleton — one shared instance for the whole app
export class BooksService {

  // ── Private dependencies ──────────────────────────────────────────────────
  private http = inject(HttpClient); // Used to call the .NET API

  // ── Private constants ─────────────────────────────────────────────────────
  private readonly apiUrl = `${environment.apiUrl}/books`; // e.g. http://localhost:5243/api/books

  // ── Get all books for the logged-in user ─────────────────────────────────
  // GET /api/books — returns Observable<Book[]>
  // The HTTP interceptor automatically attaches the Bearer token (Step 16)
  getBooks() {
    return this.http.get<Book[]>(this.apiUrl); // Typed response — TypeScript knows this returns Book[]
  }

  // ── Get a single book by Id ───────────────────────────────────────────────
  // GET /api/books/:id — returns Observable<Book>
  getBook(id: number) {
    return this.http.get<Book>(`${this.apiUrl}/${id}`); // Append the id to the URL
  }

  // ── Create a new book ─────────────────────────────────────────────────────
  // POST /api/books — sends a BookRequest, receives the created Book back
  createBook(data: BookRequest) {
    return this.http.post<Book>(this.apiUrl, data); // Returns Observable<Book> with the new book (including id)
  }

  // ── Update an existing book ───────────────────────────────────────────────
  // PUT /api/books/:id — sends updated BookRequest, receives updated Book back
  updateBook(id: number, data: BookRequest) {
    return this.http.put<Book>(`${this.apiUrl}/${id}`, data); // id in URL, data in body
  }

  // ── Delete a book by Id ───────────────────────────────────────────────────
  // DELETE /api/books/:id — returns Observable<void> (204 No Content)
  deleteBook(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`); // No response body expected
  }
}

/*
 * ===================== FILE EXPLANATION =====================
 * What this file is:
 *   The BooksService — a thin wrapper around the Books API endpoints.
 *   Every method maps to one HTTP endpoint on the .NET backend.
 *
 * Why a service instead of calling HttpClient directly in components?
 *   1. Single place to change the URL if the API changes
 *   2. Components stay clean — they call getBooks(), not http.get(url)
 *   3. Easy to test — mock the service, not HttpClient
 *
 * What are typed generics like http.get<Book[]>()?
 *   The <Book[]> tells TypeScript what shape the response will be.
 *   Without it, the response is typed as 'Object' and you lose
 *   all autocomplete and type checking. With it, TypeScript knows
 *   every property of every book object throughout the component.
 *
 * What is an Observable?
 *   Every HttpClient method returns an Observable — a lazy stream.
 *   Nothing actually fires until a component calls .subscribe()
 *   (or uses the async pipe in a template).
 *   Think of it as a promise that can emit multiple values over time,
 *   with built-in cancellation and operators like map(), filter(), tap().
 *
 * Does this service handle the JWT token?
 *   No — the AuthInterceptor (Step 16) handles that automatically.
 *   Every HTTP request made anywhere in the app gets the token
 *   attached without BooksService needing to know about it.
 *
 * Who uses this file?
 *   BookListComponent (Step 23) calls getBooks() and deleteBook()
 *   BookFormComponent (Steps 24-25) calls createBook() and updateBook()
 * ============================================================
 */
