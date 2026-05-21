# BookShelf App

A full-stack web application where users can manage their book collection and save their favourite quotes. Built with Angular 20 on the frontend and .NET 9 on the backend.

---

## What it does

Users create an account and log in. After logging in they can:

- Add, edit, and delete books from their personal collection
- Save, edit, and delete their favourite quotes
- Switch between a light and dark theme
- Use the app comfortably on any device — phone, tablet, or desktop

Each user only ever sees their own books and quotes. Everything is protected so one user cannot access another user's data.

---

## Tech stack

| Part | Technology |
|------|-----------|
| Frontend | Angular 20, Bootstrap 5, Font Awesome 6 |
| Backend | .NET 9 Web API (C#) |
| Database | SQLite via Entity Framework Core |
| Authentication | JWT (JSON Web Tokens) |

---

## How authentication works

When a user registers, their password is hashed with BCrypt and stored safely in the database — the plain password is never saved anywhere.

When a user logs in, the server checks the hash and if it matches, generates a JWT token. The token is a small signed string that the browser stores in localStorage. Every API request the frontend makes automatically attaches this token in the request header. The server reads the token to know who is making the request without touching the database each time.

---

## Project structure

```
BookApi/                  .NET 9 backend
  Controllers/            API endpoints (auth, books, quotes)
  Models/                 Database models (User, Book, Quote)
  Services/               Business logic (auth, token generation)
  Data/                   Entity Framework database context
  Migrations/             Auto-generated database migration files

book-app/                 Angular 20 frontend
  src/app/
    core/
      services/           AuthService, BooksService, QuotesService
      interceptors/       Automatically attaches JWT to every request
      guards/             Blocks unauthenticated users from protected pages
      models/             TypeScript interfaces for Book, Quote, Auth
    features/
      auth/               Login and Register pages
      books/              Book list page and Add/Edit book form
      quotes/             My Quotes page with inline add, edit, delete
    shared/
      navbar/             Top navigation bar with dark mode toggle
```

---

## Running the project locally

You need .NET 9 SDK and Node.js 20 or higher installed.

**Start the backend:**
```
cd BookApi
dotnet run --launch-profile http
```
The API runs at `http://localhost:5243`.

**Start the frontend:**
```
cd book-app
npm install
ng serve
```
The app runs at `http://localhost:4200`.

Open `http://localhost:4200` in your browser, register an account, and start adding books.

---

## Features

**Books**
- View all your books in a sortable table
- Add a new book with title, author, and publication date
- Edit any book's details
- Delete a book with a confirmation modal

**My Quotes**
- See all your saved quotes as cards in a responsive grid
- Add a quote using the form at the top of the page
- Edit a quote inline — the card turns into a form, no page change needed
- Delete a quote with a confirmation modal

**Authentication**
- Register a new account
- Log in and receive a JWT token
- Token is stored in the browser and sent automatically with every request
- Protected routes redirect to login if the user is not authenticated
- Logout clears the token from the browser

**UI**
- Responsive layout that works on mobile, tablet, and desktop
- Navbar collapses to a hamburger menu on small screens
- Light and dark theme toggle — preference is saved so it persists on reload
- Loading spinners on buttons while requests are in flight
- Error messages shown in the UI without any browser alert boxes
