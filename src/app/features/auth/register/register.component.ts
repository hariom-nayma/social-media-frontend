import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { usernameAvailabilityValidator } from './username.validator';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
})
export class RegisterComponent {
  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(AuthService);

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
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
    password: ['', Validators.required],
  });

  otpForm = this.fb.group({
    otp: ['', Validators.required],
  });

  otpSent = false;
  loading = false;
  errorMessage = '';
  private authToken = '';
  submitted = false;

  register() {
    this.submitted = true;

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.registerStart(this.registerForm.value as any).subscribe({
      next: (res) => {
        this.authToken = res.data?.authToken || '';
        this.otpSent = true;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Registration failed';
        this.loading = false;
      },
    });
  }

  verifyOtp() {
    if (this.otpForm.invalid) return;

    this.loading = true;
    const otpData = {
      token: this.authToken,
      otp: this.otpForm.value.otp,
    };

    this.authService.verifyOtpAndCompleteRegistration(otpData as any).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (err) => {
        this.errorMessage = err.error?.message || 'OTP verification failed';
        this.loading = false;
      },
    });
  }
}
