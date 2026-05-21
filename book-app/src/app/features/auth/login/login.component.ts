import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; // Reactive forms
import { Router, RouterLink } from '@angular/router';                          // Navigation
import { AuthService } from '../../../core/services/auth.service';             // Login method

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink], // ReactiveFormsModule = required for formGroup/formControlName
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  // ── Injected dependencies ─────────────────────────────────────────────────
  private fb          = inject(FormBuilder); // FormBuilder — creates the form with less boilerplate
  private authService = inject(AuthService); // Provides login()
  private router      = inject(Router);      // Navigates to /books on success

  // ── Reactive form definition ──────────────────────────────────────────────
  // FormBuilder.group() creates a FormGroup — a collection of FormControls
  // Each key matches a formControlName in the template
  // Validators.required = field cannot be empty
  // Validators.minLength(3) = at least 3 characters
  loginForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]], // ['defaultValue', [validators]]
    password: ['', [Validators.required, Validators.minLength(6)]]  // Password must be at least 6 chars
  });

  // ── UI state signals ──────────────────────────────────────────────────────
  isLoading    = signal(false);
  errorMsg     = signal('');
  showPassword = signal(false); // Toggles the password field between type="password" and type="text"

  // ── Convenience getters — shortcut to access controls in the template ─────
  get username() { return this.loginForm.get('username'); } // Used for: username?.errors, username?.touched
  get password() { return this.loginForm.get('password'); } // Used for: password?.errors, password?.touched

  // ── Form submit handler ───────────────────────────────────────────────────
  onSubmit(): void {
    if (this.loginForm.invalid) return; // Guard — do nothing if the form has validation errors

    this.isLoading.set(true); // Show loading state on the button
    this.errorMsg.set('');    // Clear any previous error

    // loginForm.value is typed as { username: string|null, password: string|null }
    // The non-null assertion (!) is safe here because Validators.required prevents null
    this.authService.login({
      username: this.loginForm.value.username!,
      password: this.loginForm.value.password!
    }).subscribe({
      next: () => {
        // Success — token was saved by the tap() operator in AuthService.login()
        this.router.navigate(['/books']); // Redirect to the books page
      },
      error: () => {
        // API returned an error (e.g. 401 wrong credentials)
        this.isLoading.set(false);
        this.errorMsg.set('Invalid username or password. Please try again.');
      }
    });
  }
}
