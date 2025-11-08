import { Component, inject, OnInit, Renderer2 } from '@angular/core';
import { DOCUMENT, CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CreatePostModalComponent } from "../create-post-modal/create-post-modal.component";
import { AuthService } from '../../../core/services/auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SettingsDialogComponent } from '../../../features/settings/settings-dialog/settings-dialog.component';
import { CreateOptionsDialogComponent } from "../create-options-dialog/create-options-dialog.component";
import { CreateReelModalComponent } from "../create-reel-modal/create-reel-modal.component";
import { SubscriptionDialogComponent } from "../subscription-dialog/subscription-dialog.component";
import { UserService } from '../../../core/services/user.service';
import { UserDTO } from '../../../core/models/user.model';
import { SearchDialogComponent } from '../search-dialog/search-dialog.component';
import { ConfirmationDialogComponent } from '../../../../app/shared/components/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, CreatePostModalComponent, MatDialogModule, CreateOptionsDialogComponent, CreateReelModalComponent, SubscriptionDialogComponent, SearchDialogComponent, ConfirmationDialogComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  showCreatePostModal = false;
  showCreateReelModal = false;
  showMoreOptions = false;
  currentUser: UserDTO | null = null;
  isExpanded = false;

  authService = inject(AuthService);
  router = inject(Router);
  dialog = inject(MatDialog);
  userService = inject(UserService);
  renderer = inject(Renderer2);
  document = inject(DOCUMENT);

  ngOnInit(): void {
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  onMouseEnter() {
    this.isExpanded = true;
    this.renderer.setStyle(this.document.documentElement, '--sidebar-width', '244px');
  }

  onMouseLeave() {
    this.isExpanded = false;
    this.renderer.setStyle(this.document.documentElement, '--sidebar-width', '72px');
  }

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
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      panelClass: 'confirmation-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authService.logout();
        this.router.navigate(['/auth/login']);
      }
    });
  }

  openSubscriptionDialog() {
    this.dialog.open(SubscriptionDialogComponent, {
      width: '500px',
      panelClass: 'golden-subscription-dialog-panel'
    });
  }

  openSearchDialog(): void {
    this.dialog.open(SearchDialogComponent, {
      width: '500px',
      maxHeight: '80vh',
      panelClass: 'search-dialog-container'
    });
  }
}