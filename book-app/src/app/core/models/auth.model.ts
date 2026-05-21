// auth.model.ts — TypeScript interfaces for authentication request and response shapes

// Sent to POST /api/auth/login and POST /api/auth/register
export interface AuthRequest {
  username: string;   // The user's login name
  password: string;   // The user's password (plain text — HTTPS encrypts it in transit)
}

// Received from POST /api/auth/login on success
export interface AuthResponse {
  token: string;      // The JWT token — store this and send it with every future request
}
