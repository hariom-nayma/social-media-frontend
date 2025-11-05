import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CreatePostModalComponent } from "../create-post-modal/create-post-modal.component";
import { AuthService } from '../../../core/services/auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SettingsDialogComponent } from '../../../features/settings/settings-dialog/settings-dialog.component';
import { CreateOptionsDialogComponent } from "../create-options-dialog/create-options-dialog.component";
import { CreateReelModalComponent } from "../create-reel-modal/create-reel-modal.component";
import { SubscriptionDialogComponent } from "../subscription-dialog/subscription-dialog.component";

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, CreatePostModalComponent, MatDialogModule, CreateOptionsDialogComponent, CreateReelModalComponent, SubscriptionDialogComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  showCreatePostModal = false;
  showCreateReelModal = false;
  showMoreOptions = false;

  authService = inject(AuthService);
  router = inject(Router);
  dialog = inject(MatDialog);

  openCreatePostModal() {
    const dialogRef = this.dialog.open(CreateOptionsDialogComponent, {
      width: '400px',
      panelClass: 'create-options-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'post') {
        this.showCreatePostModal = true;
      } else if (result === 'reel') {
        this.showCreateReelModal = true;
      }
    });
  }

  closeCreatePostModal() {
    this.showCreatePostModal = false;
  }

  closeCreateReelModal() {
    this.showCreateReelModal = false;
  }

  toggleMoreOptions() {
    this.showMoreOptions = !this.showMoreOptions;
  }

  openSettingsDialog() {
    this.dialog.open(SettingsDialogComponent, {
      width: '800px',
      height: '600px',
      panelClass: 'settings-dialog-container'
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  openSubscriptionDialog() {
    this.dialog.open(SubscriptionDialogComponent, {
      width: '500px',
    });
  }
}