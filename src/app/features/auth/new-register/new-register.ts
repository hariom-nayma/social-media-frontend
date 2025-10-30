import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { usernameAvailabilityValidator } from './username.validator';

@Component({
  selector: 'app-register',
  templateUrl: './new-register.html',
  styleUrls: ['./new-register.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
})
export class RegisterComponent {
  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(AuthService);

  step = 1; // current step

  registerForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    username: [
      '',
      {
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern(/^[a-zA-Z0-9_]+$/),
        ],
        asyncValidators: [usernameAvailabilityValidator(this.authService)],
        updateOn: 'change',
      },
    ],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  otpForm = this.fb.group({ otp: ['', Validators.required] });

  otpSent = false;
  loading = false;
  errorMessage = '';
  private authToken = '';
  submitted = false;

  get isNextButtonDisabled(): boolean {
    if (this.loading) {
      return true;
    }
    if (this.step === 1) {
      return this.registerForm.get('firstName')!.invalid || this.registerForm.get('lastName')!.invalid;
    }
    if (this.step === 2) {
      return this.registerForm.get('email')!.invalid;
    }
    if (this.step === 3) {
      return this.registerForm.invalid;
    }
    return true;
  }

  // Move to next step only if valid
  nextStep() {
    this.submitted = true;

    if (this.step === 1 && (this.registerForm.get('firstName')?.invalid || this.registerForm.get('lastName')?.invalid)) return;
    if (this.step === 2 && this.registerForm.get('email')?.invalid) return;

    this.submitted = false;
    this.step++;
  }

  prevStep() {
    if (this.step > 1) this.step--;
  }

  register() {
    this.submitted = true;

    if (this.registerForm.invalid) return;

    this.loading = true;
    this.authService.registerStart(this.registerForm.value as any).subscribe({
      next: (res) => {
        this.authToken = res.data?.authToken || '';
        this.otpSent = true;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Registration failed';
        this.errorMessage = msg;

        // Dynamic step redirection based on error
        if (msg.toLowerCase().includes('email already exists')) {
          this.step = 2; // redirect to email step
        } else if (msg.toLowerCase().includes('username already taken')) {
          this.step = 3; // redirect to username step
        }
      },
    });
  }

  verifyOtp() {
    if (this.otpForm.invalid) return;

    this.loading = true;
    const otpData = { token: this.authToken, otp: this.otpForm.value.otp };

    this.authService.verifyOtpAndCompleteRegistration(otpData as any).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (err) => {
        this.errorMessage = err.error?.message || 'OTP verification failed';
        this.loading = false;
      },
    });
  }

  // Extra helper for username validation feedback
  getUsernameError(): string {
    const ctrl = this.registerForm.get('username');
    if (!ctrl) return '';
    if (ctrl.errors?.['required']) return 'Username is required.';
    if (ctrl.errors?.['minlength']) return 'Username must be at least 3 characters.';
    if (ctrl.errors?.['pattern']) return 'Only letters, numbers and underscores (_) allowed.';
    if (ctrl.errors?.['notAvailable']) return 'Username already taken.';
    return '';
  }
}
