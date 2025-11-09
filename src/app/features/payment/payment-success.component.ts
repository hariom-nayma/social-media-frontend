import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css']
})
export class PaymentSuccessComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private paymentService = inject(PaymentService);
  id = '';
  private soundInterval: any;

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (sessionId) {
      // Here you can call your backend to confirm the payment and upgrade the user
      // For example:
      // this.paymentService.upgradeToPremium('premium', sessionId).subscribe();
      this.id = sessionId;
    }
    this.playSound(); // Play sound initially
    this.soundInterval = setInterval(() => {
      this.playSound();
    }, 5000); 
  }

  ngOnDestroy(): void {
    if (this.soundInterval) {
      clearInterval(this.soundInterval);
    }
  }

  playSound(): void {
    const audio = new Audio('assets/sounds/receipt.mp3');
    audio.play();
  }
}
