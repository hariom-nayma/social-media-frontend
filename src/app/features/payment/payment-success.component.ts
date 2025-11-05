import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  template: `
    <div>
      <h1>Payment Successful!</h1>
      <p>Your subscription has been activated.</p>
    </div>
  `
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private paymentService = inject(PaymentService);

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (sessionId) {
      // Here you can call your backend to confirm the payment and upgrade the user
      // For example:
      // this.paymentService.upgradeToPremium('premium', sessionId).subscribe();
    }
  }
}
