import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, Toast } from '../../../core/services/toast.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private subscription!: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.subscription = this.toastService.toastState.subscribe((toast) => {
      this.addToast(toast);
    });
  }

  addToast(toast: Toast) {
    this.toasts.push(toast);
    setTimeout(() => this.removeToast(toast), 4000); // Auto-dismiss after 4s
  }

  removeToast(toast: Toast) {
    (toast as Toast & { closing?: boolean }).closing = true; // trigger fade-out animation
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t !== toast);
    }, 300);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'x-circle';
      case 'info':
        return 'info';
      case 'warning':
        return 'alert-triangle';
      default:
        return 'bell';
    }
  }
}
