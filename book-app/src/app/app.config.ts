import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core'; // Core Angular config type
import { provideRouter } from '@angular/router';                                       // Provides the router with our routes
import { provideHttpClient, withInterceptors } from '@angular/common/http';           // HttpClient + functional interceptor support

import { routes } from './app.routes';                                // Our app's route definitions (Step 18)
import { authInterceptor } from './core/interceptors/auth.interceptor'; // Our JWT interceptor (Step 16)

// appConfig is the root configuration object for the entire Angular app
// It replaces the old AppModule — this is the modern standalone Angular approach
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(), // Catches unhandled errors and logs them to the console

    provideRouter(routes), // Registers the router with our route definitions

    // provideHttpClient() makes HttpClient available for injection everywhere
    // withInterceptors([authInterceptor]) registers our interceptor so it runs on every request
    // Multiple interceptors can be added to the array — they run in order
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
  ]
};

/*
 * ===================== FILE EXPLANATION =====================
 * What this file is:
 *   The root application configuration. It is the modern replacement
 *   for AppModule in Angular's standalone component architecture.
 *
 * What are providers?
 *   Providers are instructions that tell Angular's DI system
 *   what is available and how to create it.
 *   - provideRouter(routes)    → makes the Router available app-wide
 *   - provideHttpClient(...)   → makes HttpClient available app-wide
 *
 * Why provideHttpClient() here instead of AppModule?
 *   In the old Angular (module-based), you imported HttpClientModule
 *   in AppModule. In modern Angular (standalone), you call
 *   provideHttpClient() here in appConfig. Same result, cleaner code.
 *
 * What does withInterceptors([authInterceptor]) do?
 *   It tells Angular: "apply these interceptor functions to every
 *   HTTP request made by HttpClient anywhere in this app."
 *   The array can hold multiple interceptors — they run left to right.
 *   Our authInterceptor runs first (and only one exists for now).
 *
 * What will be added here later?
 *   Nothing — this file is complete. Routes will be added to
 *   app.routes.ts in Step 18, not here.
 * ============================================================
 */
