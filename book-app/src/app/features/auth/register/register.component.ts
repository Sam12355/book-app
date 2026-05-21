import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  private fb          = inject(FormBuilder);
  private authService = inject(AuthService);
  private router      = inject(Router);

  // Validator that runs on the whole form group, not a single field.
  // It compares the password and confirmPassword fields and returns an error if they differ.
  // Returning null means the form is valid.
  private passwordsMatch(control: AbstractControl): ValidationErrors | null {
    const password        = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  registerForm = this.fb.group(
    {
      username:        ['', [Validators.required, Validators.minLength(3)]],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: this.passwordsMatch } // Attach the cross-field validator to the group level
  );

  isLoading           = signal(false);
  errorMsg            = signal('');
  successMsg          = signal('');
  showPassword        = signal(false); // Toggles the password field between masked and visible
  showConfirmPassword = signal(false); // Same for the confirm password field

  // Shortcut getters so the template can write username?.errors instead of registerForm.get('username')?.errors
  get username()        { return this.registerForm.get('username'); }
  get password()        { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMsg.set(''); // Clear any previous error before the new request

    this.authService.register({
      username: this.registerForm.value.username!,
      password: this.registerForm.value.password!
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMsg.set('Account created! Redirecting to login...');
        setTimeout(() => this.router.navigate(['/login']), 1500); // Give the user time to read the message
      },
      error: (err) => {
        this.isLoading.set(false);
        // err.error can be a plain string (our custom API message) or a ProblemDetails object
        // (ASP.NET Core returns ProblemDetails automatically for model validation failures)
        if (typeof err.error === 'string') {
          this.errorMsg.set(err.error);
        } else if (err.error?.title) {
          this.errorMsg.set(err.error.title);
        } else {
          this.errorMsg.set('Registration failed. Please try again.');
        }
      }
    });
  }
}
