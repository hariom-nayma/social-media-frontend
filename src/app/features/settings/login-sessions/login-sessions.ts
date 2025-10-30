import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../core/services/session.service';
import { Session } from '../../../core/models/session.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login-sessions',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './login-sessions.html',
  styleUrls: ['./login-sessions.css']
})
export class LoginSessionsComponent implements OnInit {
  sessions: Session[] = [];
  currentSessionId: string | null = null;

  sessionService = inject(SessionService);
  snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.fetchSessions();
    // In a real app, you'd get the current session ID from a token or cookie
    // For now, we'll assume the first session fetched is the current one for demonstration
    // Or, you could parse the JWT token to get the session ID if it's included.
    // For this example, we'll just mark the first one as current if available.
  }

  fetchSessions(): void {
    this.sessionService.getActiveSessions().subscribe({
      next: res => {
        if (res.data) {
          this.sessions = res.data;
          if (this.sessions.length > 0 && !this.currentSessionId) {
            // This is a placeholder. In a real app, you'd identify the current session more robustly.
            this.currentSessionId = this.sessions[0].id; 
          }
        }
      },
      error: err => {
        this.snackBar.open('Failed to fetch sessions.', 'Close', { duration: 3000 });
        console.error('Error fetching sessions:', err);
      }
    });
  }

  terminateSession(sessionId: string): void {
    if (sessionId === this.currentSessionId) {
      this.snackBar.open('Cannot terminate your current session.', 'Close', { duration: 3000 });
      return;
    }

    this.sessionService.terminateSession(sessionId).subscribe({
      next: res => {
        this.snackBar.open(res.message || 'Session terminated.', 'Close', { duration: 3000 });
        this.fetchSessions(); // Refresh the list
      },
      error: err => {
        this.snackBar.open('Failed to terminate session.', 'Close', { duration: 3000 });
        console.error('Error terminating session:', err);
      }
    });
  }

  terminateAllOtherSessions(): void {
    this.sessionService.terminateAllOtherSessions().subscribe({
      next: res => {
        this.snackBar.open(res.message || 'All other sessions terminated.', 'Close', { duration: 3000 });
        this.fetchSessions(); // Refresh the list
      },
      error: err => {
        this.snackBar.open('Failed to terminate all other sessions.', 'Close', { duration: 3000 });
        console.error('Error terminating all other sessions:', err);
      }
    });
  }
}
