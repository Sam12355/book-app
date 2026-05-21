import { Component, inject, OnInit, signal } from '@angular/core'; // signal() for dark mode state
import { RouterLink, RouterLinkActive } from '@angular/router';   // RouterLink = [routerLink], RouterLinkActive = active class
import { AuthService } from '../../../core/services/auth.service'; // AuthService — isLoggedIn signal + logout()
import { NgIf } from '@angular/common';                            // NgIf — needed for @if in non-control-flow templates

@Component({
  selector: 'app-navbar',       // Used as <app-navbar> in app.html
  standalone: true,             // Standalone — no NgModule needed
  imports: [RouterLink, RouterLinkActive, NgIf], // Declare what this component uses in its template
  templateUrl: './navbar.component.html',        // External HTML file
  styleUrl: './navbar.component.scss'            // External SCSS file
})
export class NavbarComponent implements OnInit {

  // ── Injected services ─────────────────────────────────────────────────────
  authService = inject(AuthService); // Public — template reads authService.isLoggedIn()

  // ── Dark mode signal ──────────────────────────────────────────────────────
  // signal() holds the current dark mode state — true = dark, false = light
  // The template reads isDark() and updates the button icon reactively
  isDark = signal<boolean>(false);

  // ── OnInit — restore dark mode preference from localStorage ───────────────
  // Runs once when the component is first created
  ngOnInit(): void {
    // Check if the user had dark mode on during their last visit
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.applyDark(true); // Re-apply dark mode immediately on load
    }
  }

  // ── Toggle between light and dark mode ────────────────────────────────────
  toggleDarkMode(): void {
    this.applyDark(!this.isDark()); // Flip the current value
  }

  // ── Apply or remove dark mode ─────────────────────────────────────────────
  private applyDark(dark: boolean): void {
    this.isDark.set(dark); // Update the signal — button icon re-renders automatically

    if (dark) {
      document.body.classList.add('dark-mode');       // Add CSS class → all CSS variables switch to dark values
      localStorage.setItem('theme', 'dark');          // Persist preference
    } else {
      document.body.classList.remove('dark-mode');    // Remove CSS class → CSS variables switch back to light values
      localStorage.setItem('theme', 'light');         // Persist preference
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  logout(): void {
    this.authService.logout(); // Clears token, updates isLoggedIn signal, redirects to /login
  }
}
