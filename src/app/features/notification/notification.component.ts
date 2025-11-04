import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/notification.model';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PostDetailsDialogComponent } from '../../shared/components/post-details-dialog/post-details-dialog.component';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit {
  notifications$!: Observable<Notification[]>;

  constructor(
    private notificationService: NotificationService,
    private dialog: MatDialog,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.notifications$ = this.notificationService.notifications$;
    this.notificationService.fetchRecent();
  }

  handleNotificationClick(notification: Notification): void {
    this.markAsRead(notification);

    if (notification.type === 'LIKE' || notification.type === 'COMMENT') {
      if (notification.postId) {
        this.dialog.open(PostDetailsDialogComponent, {
          width: '500px',
          data: { postId: notification.postId }
        });
      }
    } else if (notification.type === 'FOLLOW' && notification.senderUsername) {
      this.router.navigate(['/profile', notification.senderUsername]);
    }
  }

  markAsRead(notification: Notification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        notification.read = true;
      });
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'LIKE': return '❤️';
      case 'COMMENT': return '💬';
      case 'FOLLOW': return '👤';
      default: return '🔔';
    }
  }
}
