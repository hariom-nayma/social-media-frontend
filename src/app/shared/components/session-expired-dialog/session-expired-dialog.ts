import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-session-expired-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './session-expired-dialog.html',
  styleUrls: ['./session-expired-dialog.css']
})
export class SessionExpiredDialogComponent {
  dialogRef = inject(MatDialogRef<SessionExpiredDialogComponent>);
  router = inject(Router);
  authService = inject(AuthService);

  constructor() { }

  loginAgain(): void {
    this.authService.logout();
    this.dialogRef.close();
    this.router.navigate(['/auth/login']);
  }
}
