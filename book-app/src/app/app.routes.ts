import { Routes } from '@angular/router';       // Routes = the type for the route configuration array
import { authGuard } from './core/guards/auth.guard'; // Our guard — blocks unauthenticated access

// routes = the complete map of URLs → components for the whole app
// Each object in the array is one route definition
export const routes: Routes = [

  // ── Default redirect ───────────────────────────────────────────────────────
  {
    path: '',                    // Empty path = root URL "/"
    redirectTo: 'books',         // Redirect to /books by default
    pathMatch: 'full'            // Only match when the FULL path is empty (not just a prefix)
  },

  // ── Auth routes (public — no guard) ───────────────────────────────────────
  {
    path: 'login',               // URL: /login
    // loadComponent() = lazy loading — the LoginComponent bundle is only downloaded
    // when the user first visits /login, not on initial app load (better performance)
    loadComponent: () =>
      import('./features/auth/login/login.component')
        .then(m => m.LoginComponent) // .then() extracts the named export from the module
  },
  {
    path: 'register',            // URL: /register
    loadComponent: () =>
      import('./features/auth/register/register.component')
        .then(m => m.RegisterComponent)
  },

  // ── Protected routes (auth guard applied) ─────────────────────────────────
  // canActivate: [authGuard] means: run authGuard() before loading this component
  // If the guard returns false/UrlTree, the component never loads
  {
    path: 'books',               // URL: /books
    canActivate: [authGuard],    // Protected — must be logged in
    loadComponent: () =>
      import('./features/books/book-list/book-list.component')
        .then(m => m.BookListComponent)
  },
  {
    path: 'books/add',           // URL: /books/add — form for creating a new book
    canActivate: [authGuard],    // Protected — must be logged in
    loadComponent: () =>
      import('./features/books/book-form/book-form.component')
        .then(m => m.BookFormComponent)
  },
  {
    path: 'books/edit/:id',      // URL: /books/edit/5 — form for editing book with id=5
    canActivate: [authGuard],    // Protected — must be logged in
    // :id is a route parameter — the component reads it with ActivatedRoute (Step 25)
    loadComponent: () =>
      import('./features/books/book-form/book-form.component')
        .then(m => m.BookFormComponent)
  },
  {
    path: 'quotes',              // URL: /quotes
    canActivate: [authGuard],    // Protected — must be logged in
    loadComponent: () =>
      import('./features/quotes/quotes.component')
        .then(m => m.QuotesComponent)
  },

  // ── Wildcard route — must be LAST ──────────────────────────────────────────
  {
    path: '**',                  // "**" matches any URL not matched above
    redirectTo: 'books'          // Unknown URL → redirect to books (acts as a 404 handler)
  }
];

/*
 * ===================== FILE EXPLANATION =====================
 * What this file is:
 *   The complete URL map for the Angular app.
 *   Every URL the user can visit is defined here as a route object.
 *
 * What is Lazy Loading (loadComponent)?
 *   By default, Angular bundles all components into one large file.
 *   With loadComponent(), each component is split into its own chunk.
 *   That chunk is only downloaded when the user navigates to that route.
 *
 *   Example: a user who only visits /login never downloads the
 *   BookListComponent code. The app loads faster.
 *
 *   The syntax:
 *   loadComponent: () => import('./path').then(m => m.ClassName)
 *   - import() = dynamic import — returns a Promise
 *   - .then(m => m.ClassName) = extract the named export from the module
 *
 * What is pathMatch: 'full'?
 *   Without it, path: '' would match EVERY URL (because every URL
 *   starts with an empty string). 'full' means only match when the
 *   entire URL is exactly "".
 *
 * What is the :id route parameter?
 *   In path: 'books/edit/:id', the :id is a placeholder.
 *   /books/edit/5 → id = "5"
 *   /books/edit/42 → id = "42"
 *   The BookFormComponent reads this value to know which book to load.
 *
 * Why is '**' last?
 *   Angular matches routes top-to-bottom and stops at the first match.
 *   If '**' were first, it would match everything and nothing else
 *   would ever be reached. Wildcard must always be last.
 *
 * What pages are protected?
 *   /books, /books/add, /books/edit/:id, /quotes
 *   Unauthenticated users hitting these are redirected to /login.
 * ============================================================
 */
