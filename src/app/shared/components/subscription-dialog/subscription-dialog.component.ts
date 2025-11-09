import { Component, inject, ElementRef, ViewChild, HostListener, AfterViewInit } from '@angular/core';
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
export class SubscriptionDialogComponent implements AfterViewInit {
  @ViewChild('card') card!: ElementRef;

  private paymentService = inject(PaymentService);
  private toastService = inject(ToastService);
  private dialogRef = inject(MatDialogRef<SubscriptionDialogComponent>);
  stripePromise = loadStripe(environment.stripePublishableKey);

  ngAfterViewInit(): void {
    this.playAnimation();
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent) {
    this.cardUpdate(event);
  }

  cardUpdate(e: PointerEvent) {
    const position = this.pointerPositionRelativeToElement(this.card.nativeElement, e);
    const [px, py] = position.pixels;
    const [perx, pery] = position.percent;
    const [dx, dy] = this.distanceFromCenter(this.card.nativeElement, px, py);
    const edge = this.closenessToEdge(this.card.nativeElement, px, py);
    const angle = this.angleFromPointerEvent(this.card.nativeElement, dx, dy);

    this.card.nativeElement.style.setProperty('--pointer-x', `${this.round(perx)}%`);
    this.card.nativeElement.style.setProperty('--pointer-y', `${this.round(pery)}%`);
    this.card.nativeElement.style.setProperty('--pointer-°', `${this.round(angle)}deg`);
    this.card.nativeElement.style.setProperty('--pointer-d', `${this.round(edge * 100)}`);

    this.card.nativeElement.classList.remove('animating');
  }

  centerOfElement($el: HTMLElement) {
    const { width, height } = $el.getBoundingClientRect();
    return [width / 2, height / 2];
  }

  pointerPositionRelativeToElement($el: HTMLElement, e: PointerEvent) {
    const pos = [e.clientX, e.clientY];
    const { left, top, width, height } = $el.getBoundingClientRect();
    const x = pos[0] - left;
    const y = pos[1] - top;
    const px = this.clamp((100 / width) * x);
    const py = this.clamp((100 / height) * y);
    return { pixels: [x, y], percent: [px, py] };
  }

  angleFromPointerEvent($el: HTMLElement, dx: number, dy: number) {
    let angleRadians = 0;
    let angleDegrees = 0;
    if (dx !== 0 || dy !== 0) {
      angleRadians = Math.atan2(dy, dx);
      angleDegrees = angleRadians * (180 / Math.PI) + 90;
      if (angleDegrees < 0) {
        angleDegrees += 360;
      }
    }
    return angleDegrees;
  }

  distanceFromCenter($card: HTMLElement, x: number, y: number) {
    const [cx, cy] = this.centerOfElement($card);
    return [x - cx, y - cy];
  }

  closenessToEdge($card: HTMLElement, x: number, y: number) {
    const [cx, cy] = this.centerOfElement($card);
    const [dx, dy] = this.distanceFromCenter($card, x, y);
    let k_x = Infinity;
    let k_y = Infinity;
    if (dx !== 0) {
      k_x = cx / Math.abs(dx);
    }
    if (dy !== 0) {
      k_y = cy / Math.abs(dy);
    }
    return this.clamp(1 / Math.min(k_x, k_y), 0, 1);
  }

  round(value: number, precision = 3) {
    return parseFloat(value.toFixed(precision));
  }

  clamp(value: number, min = 0, max = 100) {
    return Math.min(Math.max(value, min), max);
  }

  playAnimation() {
    const angleStart = 110;
    const angleEnd = 465;

    this.card.nativeElement.style.setProperty('--pointer-°', `${angleStart}deg`);
    this.card.nativeElement.classList.add('animating');

    this.animateNumber({
      ease: this.easeOutCubic,
      duration: 500,
      onUpdate: (v: number) => {
        this.card.nativeElement.style.setProperty('--pointer-d', v);
      },
    });

    this.animateNumber({
      ease: this.easeInCubic,
      delay: 0,
      duration: 1500,
      endValue: 50,
      onUpdate: (v: number) => {
        const d = (angleEnd - angleStart) * (v / 100) + angleStart;
        this.card.nativeElement.style.setProperty('--pointer-°', `${d}deg`);
      },
    });

    this.animateNumber({
      ease: this.easeOutCubic,
      delay: 1500,
      duration: 2250,
      startValue: 50,
      endValue: 100,
      onUpdate: (v: number) => {
        const d = (angleEnd - angleStart) * (v / 100) + angleStart;
        this.card.nativeElement.style.setProperty('--pointer-°', `${d}deg`);
      },
    });

    this.animateNumber({
      ease: this.easeInCubic,
      duration: 1500,
      delay: 2500,
      startValue: 100,
      endValue: 0,
      onUpdate: (v: number) => {
        this.card.nativeElement.style.setProperty('--pointer-d', v);
      },
      onEnd: () => {
        this.card.nativeElement.classList.remove('animating');
      },
    });
  }

  easeOutCubic(x: number) {
    return 1 - Math.pow(1 - x, 3);
  }

  easeInCubic(x: number) {
    return x * x * x;
  }

  animateNumber(options: any) {
    const {
      startValue = 0,
      endValue = 100,
      duration = 1000,
      delay = 0,
      onUpdate = () => {},
      ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      onStart = () => {},
      onEnd = () => {},
    } = options;

    const startTime = performance.now() + delay;

    const update = () => {
      const currentTime = performance.now();
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easedValue = startValue + (endValue - startValue) * ease(t);

      onUpdate(easedValue);

      if (t < 1) {
        requestAnimationFrame(update);
      } else if (t >= 1) {
        onEnd();
      }
    };

    setTimeout(() => {
      onStart();
      requestAnimationFrame(update);
    }, delay);
  }

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

  setLightTheme() {
    document.body.classList.add('light');
    this.card.nativeElement.closest('#app').classList.add('light');
  }

  setDarkTheme() {
    document.body.classList.remove('light');
    this.card.nativeElement.closest('#app').classList.remove('light');
  }
}
