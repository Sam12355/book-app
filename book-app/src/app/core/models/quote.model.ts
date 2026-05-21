// quote.model.ts — TypeScript interface that mirrors the Quote model from the .NET API

export interface Quote {
  id: number;       // Unique identifier — assigned by the database
  text: string;     // The full text of the quote
  userId: number;   // The Id of the user who owns this quote
}

// Used when creating or updating a quote — no id or userId (server sets those)
export interface QuoteRequest {
  text: string;     // Required — the quote text
}
