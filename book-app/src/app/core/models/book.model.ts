// book.model.ts — TypeScript interface that mirrors the Book model from the .NET API
// Using an interface (not a class) is best practice for data shapes — no runtime overhead

export interface Book {
  id: number;               // Unique identifier — assigned by the database
  title: string;            // The book's title
  author: string;           // The book's author
  publicationDate: string;  // ISO date string e.g. "1965-08-01" — matches .NET DateOnly serialisation
  userId: number;           // The Id of the user who owns this book
}

// Used when creating or updating a book — no id or userId (server sets those)
export interface BookRequest {
  title: string;            // Required — the book's title
  author: string;           // Required — the book's author
  publicationDate: string;  // Required — ISO date string
}
