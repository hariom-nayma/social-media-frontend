import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CreatePostModalComponent } from "../create-post-modal/create-post-modal.component";
import { AuthService } from '../../../core/services/auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SettingsDialogComponent } from '../../../features/settings/settings-dialog/settings-dialog.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, CreatePostModalComponent, MatDialogModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  showCreatePostModal = false;
  showMoreOptions = false;

  authService = inject(AuthService);
  router = inject(Router);
  dialog = inject(MatDialog);

  openCreatePostModal() {
    this.showCreatePostModal = true;
  }

  closeCreatePostModal() {
    this.showCreatePostModal = false;
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
}
