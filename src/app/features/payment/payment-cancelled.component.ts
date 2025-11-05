import { Component } from '@angular/core';

@Component({
  selector: 'app-payment-cancelled',
  standalone: true,
  template: `
    <div>
      <h1>Payment Cancelled</h1>
      <p>Your payment was not processed.</p>
    </div>
  `
})
export class PaymentCancelledComponent {}
