# BookShelf App

A full-stack web app where users can manage their book collection and save favourite quotes. Built with Angular 20 on the frontend and .NET 9 on the backend.

## What it does

Users create an account and log in. After logging in they can:

- Add, edit, and delete books from their personal collection
- Save, edit, and delete their favourite quotes
- Switch between a light and dark theme
- Use the app on any device (phone, tablet, or desktop)

Each user only sees their own books and quotes. One user cannot access another user's data.

## Tech stack

| Part | Technology |
|------|-----------|
| Frontend | Angular 20, Bootstrap 5, Font Awesome 6 |
| Backend | .NET 9 Web API (C#) |
| Database | SQLite via Entity Framework Core |
| Authentication | JWT (JSON Web Tokens) |

## How authentication works

When a user registers, their password is hashed with BCrypt and stored in the database. The plain password is never saved.

When a user logs in, the server checks the hash and if it matches, generates a JWT token. The browser stores this token in localStorage. Every API request automatically attaches the token in the request header so the server knows who is making the request.

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
      interceptors/       Attaches JWT to every outgoing request
      guards/             Blocks unauthenticated users from protected pages
      models/             TypeScript interfaces for Book, Quote, Auth
    features/
      auth/               Login and Register pages
      books/              Book list page and Add/Edit book form
      quotes/             My Quotes page with inline add, edit, delete
    shared/
      navbar/             Top navigation bar with dark mode toggle
```

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

## Features

**Books**
- View all your books in a table
- Add a new book with title, author, and publication date
- Edit any book
- Delete a book with a confirmation modal

**My Quotes**
- See all your saved quotes as cards
- Add a quote using the form at the top of the page
- Edit a quote inline without leaving the page
- Delete a quote with a confirmation modal

**Authentication**
- Register a new account
- Log in and receive a JWT token
- Token is stored in the browser and sent with every request automatically
- Protected routes redirect to login if not authenticated
- Logout clears the token

**UI**
- Works on mobile, tablet, and desktop
- Navbar collapses to a hamburger menu on small screens
- Light and dark theme toggle that saves your preference
- Loading spinners on buttons while waiting for a response
- Error messages shown in the UI, no browser alert boxes

## Tests

**Backend (xUnit)**
- `BookApi.Tests/AuthServiceTests.cs` covers register, login, and token generation
- `BookApi.Tests/BooksControllerTests.cs` covers CRUD operations and user isolation

**Frontend (Vitest)**
- `auth.service.spec.ts` covers token storage, login, register, and logout
- `books.service.spec.ts` covers all HTTP calls
- `toast.service.spec.ts` covers toast display and auto-dismiss
