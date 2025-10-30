import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import * as Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';
import { AuthService } from './auth.service';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private stompClient!: Stomp.Client;
  private apiUrl = `${environment.apiUrl}/notifications`;
  private notificationSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService, private ngZone: NgZone) { }

  private _convertNotificationDates(notification: Notification): Notification {
    return {
      ...notification,
      createdAt: new Date(notification.createdAt)
    };
  }

  connect() {
    const accessToken = this.authService.getAccessToken();
    const socket = new SockJS(`${environment.apiUrl.replace('/api', '')}/ws?token=${accessToken}`);
    this.stompClient = Stomp.over(socket);
    const headers = {
      'Authorization': `Bearer ${accessToken}`
    };
    console.log('WebSocket connection attempt with token:', accessToken);

    this.stompClient.connect(headers, () => {
      this.stompClient.subscribe('/user/queue/notifications', (message) => {
        this.ngZone.run(() => {
          const notification: Notification = JSON.parse(message.body);
          const convertedNotification = this._convertNotificationDates(notification);
          const currentNotifications = this.notificationSubject.value;
          this.notificationSubject.next([convertedNotification, ...currentNotifications]);
          console.log('WebSocket: New notification emitted:', convertedNotification);
          console.log('Current notifications in service:', this.notificationSubject.value);
        });
      });
    }, (error: any) => {
      console.error('WebSocket connection error:', error);
    });
  }

  fetchRecent() {
    this.http.get<Notification[]>(`${this.apiUrl}/recent`).subscribe({
      next: res => {
        if (res) {
          const convertedNotifications = res.map(n => this._convertNotificationDates(n));
          this.notificationSubject.next(convertedNotifications);
          console.log('HTTP: Recent notifications emitted:', convertedNotifications);
          console.log('Current notifications in service:', this.notificationSubject.value);
        } else {
          console.log('HTTP: No data received for recent notifications.');
        }
      },
      error: err => {
        console.error('HTTP Error fetching recent notifications:', err);
      }
    });
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${notificationId}/read`, {});
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.disconnect(() => {});
    }
  }
}
