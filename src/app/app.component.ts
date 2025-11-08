import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AuthService } from './core/services/auth.service';
import { CallService } from './core/services/call.service';
import { UserService } from './core/services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from './shared/components/confirmation-dialog/confirmation-dialog';
import { CallComponent } from './features/call/call.component';
import { ModalService } from './core/services/modal.service'; // Import ModalService
import { CreatePostModalComponent } from './shared/components/create-post-modal/create-post-modal.component'; // Import CreatePostModalComponent
import { CreateReelModalComponent } from './shared/components/create-reel-modal/create-reel-modal.component'; // Import CreateReelModalComponent
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, // Add CommonModule here
    RouterOutlet,
    LazyLoadImageModule,
    ToastComponent,
    CreatePostModalComponent,
    CreateReelModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'social-media-frontend';
  showCreatePostModal = false;
  showCreateReelModal = false;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private callService: CallService,
    private userService: UserService,
    private dialog: MatDialog,
    private modalService: ModalService // Inject ModalService
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

    // Subscribe to modal visibility changes
    this.subscriptions.add(this.modalService.showCreatePostModalChange.subscribe(value => {
      this.showCreatePostModal = value;
      console.log('AppComponent: showCreatePostModal updated to', value);
    }));
    this.subscriptions.add(this.modalService.showCreateReelModalChange.subscribe(value => {
      this.showCreateReelModal = value;
      console.log('AppComponent: showCreateReelModal updated to', value);
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  closeCreatePostModal(): void {
    this.modalService.closeCreatePostModal();
  }

  closeCreateReelModal(): void {
    console.log('AppComponent: closeCreateReelModal called');
    this.modalService.closeCreateReelModal();
  }
}
