import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/notification.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications$!: Observable<Notification[]>;

  constructor(private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.notifications$ = this.notificationService.notifications$;
    this.notifications$.subscribe(notifications => {
      console.log('NotificationComponent: Received notifications:', notifications);
    });
    this.notificationService.connect();
    this.notificationService.fetchRecent();
  }

  ngOnDestroy(): void {
    this.notificationService.disconnect();
  }

  markAsRead(notification: Notification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        notification.read = true;
      });
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'LIKE':
        return 'fas fa-heart';
      case 'COMMENT':
        return 'fas fa-comment';
      case 'FOLLOW':
        return 'fas fa-user-plus';
      default:
        return 'fas fa-bell';
    }
  }
}
