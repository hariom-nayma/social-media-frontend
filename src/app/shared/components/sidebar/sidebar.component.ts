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
import { ModalService } from '../../../core/services/modal.service'; // Import ModalService

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CreatePostModalComponent,
    MatDialogModule,
    CreateOptionsDialogComponent,
    CreateReelModalComponent,
    SubscriptionDialogComponent,
    SearchDialogComponent,
    ConfirmationDialogComponent
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  showMoreOptions = false;
  currentUser: UserDTO | null = null;
  isExpanded = false;
  isDarkMode = false;

  authService = inject(AuthService);
  router = inject(Router);
  dialog = inject(MatDialog);
  userService = inject(UserService);
  renderer = inject(Renderer2);
  document = inject(DOCUMENT);
  modalService = inject(ModalService); // Inject ModalService

  ngOnInit(): void {
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
    this.applyTheme();
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
        this.modalService.openCreatePostModal(); // Use ModalService
      } else if (result === 'reel') {
        this.modalService.openCreateReelModal(); // Use ModalService
      }
    });
  }

  // Removed closeCreatePostModal() and closeCreateReelModal()

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

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    const body = this.document.body;
    if (this.isDarkMode) {
      body.classList.add('dark-theme');
    } else {
      body.classList.remove('dark-theme');
    }
  }
}
