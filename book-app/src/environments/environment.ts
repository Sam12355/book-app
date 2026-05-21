// environment.ts — Development environment configuration
// This file is used when running: ng serve
// For production, Angular swaps this file with environment.prod.ts automatically
export const environment = {
  production: false,                          // Flag: false in dev, true in prod
  apiUrl: 'http://localhost:5243/api'         // Base URL of our .NET API (dev server port)
};
