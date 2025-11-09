import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PaymentService } from '../../../core/services/payment.service';
import { loadStripe } from '@stripe/stripe-js';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-subscription-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './subscription-dialog.component.html',
  styleUrls: ['./subscription-dialog.component.css']
})
export class SubscriptionDialogComponent {
  private paymentService = inject(PaymentService);
  private toastService = inject(ToastService);
  private dialogRef = inject(MatDialogRef<SubscriptionDialogComponent>);
  stripePromise = loadStripe(environment.stripePublishableKey);

  selectPlan(plan: string): void {
    this.paymentService.createPaymentIntent(plan).subscribe({
      next: (response) => {
        if (response.data) {
          this.redirectToCheckout(response.data);
        }
      },
      error: (err) => {
        console.error('Error creating payment intent:', err);
        this.toastService.show('Failed to create payment intent.', 'error');
      }
    });
  }

  redirectToCheckout(sessionUrl: string): void {
    this.dialogRef.close();
    window.location.href = sessionUrl;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
