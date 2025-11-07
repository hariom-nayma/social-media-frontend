import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AuthService } from './core/services/auth.service';
import { CallService } from './core/services/call.service';
import { UserService } from './core/services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from './shared/components/confirmation-dialog/confirmation-dialog';
import { CallComponent } from './features/call/call.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LazyLoadImageModule, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'social-media-frontend';

  constructor(
    private authService: AuthService,
    private callService: CallService,
    private userService: UserService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.userService.myMiniProfile().subscribe(response => {
          const user = response.data;
          if (user) {
            const token = this.authService.getAccessToken();
            if (token) {
              this.callService.connect(token, user.username);
            }
          }
        });
      }
    });

    this.callService.incomingCall$.subscribe(offer => {
      if (offer) {
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
          data: { message: `Incoming call from ${offer.from}. Do you want to accept?` }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.dialog.open(CallComponent, {
              width: '100vw',
              height: '100vh',
              maxWidth: '100vw',
              data: { offer: offer }
            });
          }
        });
      }
    });
  }
}
