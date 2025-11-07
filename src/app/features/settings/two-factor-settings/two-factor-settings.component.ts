import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { UserDTO } from '../../../core/models/user.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-two-factor-settings',
  standalone: true,
  imports: [CommonModule, FormsModule], // Will add CommonModule and FormsModule later
  templateUrl: './two-factor-settings.html',
  styleUrl: './two-factor-settings.css'
})
export class TwoFactorSettingsComponent implements OnInit {
  currentUser: UserDTO | null = null;
  phoneNumber: string = '';
  otp: string = '';
  otpSent: boolean = false;
  otpMessage: string = '';
  twoFactorMessage: string = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.userService.getMyProfile().subscribe(response => {
      if (response.data) {
        this.currentUser = response.data;
        this.phoneNumber = this.currentUser.phoneNumber || ''; // Assuming phoneNumber exists in UserDTO
      }
    });
  }

  sendOtp(): void {
    if (!this.phoneNumber) {
      this.otpMessage = 'Please enter a phone number.';
      return;
    }
    this.otpMessage = '';
    this.userService.sendPhoneNumberVerificationOtp(this.phoneNumber).subscribe(
      response => {
        this.otpSent = true;
        this.otpMessage = response.message || 'OTP sent successfully!';
      },
      error => {
        this.otpMessage = error.error?.message || 'Failed to send OTP.';
        console.error('Error sending OTP:', error);
      }
    );
  }

  verifyOtp(): void {
    if (!this.phoneNumber || !this.otp) {
      this.otpMessage = 'Please enter phone number and OTP.';
      return;
    }
    this.otpMessage = '';
    this.userService.verifyPhoneNumber(this.phoneNumber, this.otp).subscribe(
      response => {
        this.otpMessage = response.message || 'Phone number verified successfully!';
        this.otpSent = false;
        this.otp = '';
        this.loadCurrentUser(); // Reload user to update verification status
      },
      error => {
        this.otpMessage = error.error?.message || 'Failed to verify OTP.';
        console.error('Error verifying OTP:', error);
      }
    );
  }

  toggleTwoFactor(): void {
    if (!this.currentUser?.phoneNumberVerified) {
      this.twoFactorMessage = 'Please verify your phone number first.';
      return;
    }

    this.twoFactorMessage = '';
    if (this.currentUser?.twoFactorEnabled) {
      this.userService.deactivateTwoFactorAuthentication().subscribe(
        response => {
          this.twoFactorMessage = response.message || 'Two-factor authentication deactivated.';
          this.loadCurrentUser();
        },
        error => {
          this.twoFactorMessage = error.error?.message || 'Failed to deactivate 2FA.';
          console.error('Error deactivating 2FA:', error);
        }
      );
    } else {
      this.userService.activateTwoFactorAuthentication().subscribe(
        response => {
          this.twoFactorMessage = response.message || 'Two-factor authentication activated.';
          this.loadCurrentUser();
        },
        error => {
          this.twoFactorMessage = error.error?.message || 'Failed to activate 2FA.';
          console.error('Error activating 2FA:', error);
        }
      );
    }
  }
}
