import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-two-factor-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './two-factor-login.html',
  styleUrl: './two-factor-login.css'
})
export class TwoFactorLoginPageComponent implements OnInit {
  phoneNumber: string = '';
  phoneNumberLastFourDigits: string = '';
  otp: string = '';
  errorMessage: string = '';
  loginRequest: any; // To store email and password temporarily

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.phoneNumber = params['phoneNumber'];
      this.loginRequest = {
        email: params['email'],
        password: params['password']
      };
      if (this.phoneNumber) {
        this.phoneNumberLastFourDigits = this.phoneNumber.slice(-4);
      }
    });
  }

  verifyOtp(): void {
    this.errorMessage = '';
    if (!this.otp) {
      this.errorMessage = 'Please enter the OTP.';
      return;
    }

    this.authService.loginWithOtp(this.loginRequest, this.otp).subscribe(
      response => {
        if (response.status) {
          this.router.navigate(['/home']);
        } else {
          this.errorMessage = response.message || 'Invalid OTP.';
        }
      },
      error => {
        this.errorMessage = error.error?.message || 'An error occurred during OTP verification.';
        console.error('OTP verification error:', error);
      }
    );
  }

  resendOtp(): void {
    this.errorMessage = '';
    if (!this.phoneNumber) {
      this.errorMessage = 'Phone number not found for resending OTP.';
      return;
    }
    // Assuming there's a way to resend OTP without re-entering password,
    // or the backend handles resending based on the stored phone number.
    // For now, we'll just re-trigger the initial login flow which sends OTP.
    // In a real app, you'd have a dedicated resend OTP endpoint.
    this.authService.login(this.loginRequest).subscribe(
      response => {
        if (response.data?.twoFactorRequired) {
          this.errorMessage = 'OTP has been re-sent.';
        } else {
          this.errorMessage = 'Failed to resend OTP.';
        }
      },
      error => {
        this.errorMessage = error.error?.message || 'Failed to resend OTP.';
        console.error('Resend OTP error:', error);
      }
    );
  }
}
