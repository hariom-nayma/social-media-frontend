import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { SecuritySettingsComponent } from '../security-settings/security-settings.component';
import { ArchivedPostsComponent } from '../archived-posts/archived-posts.component';
import { AccountSettingsComponent } from '../account-settings/account-settings.component';


@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, AccountSettingsComponent, SecuritySettingsComponent, ArchivedPostsComponent],
  templateUrl: './settings-dialog.html',
  styleUrls: ['./settings-dialog.css']
})
export class SettingsDialogComponent {
  activePage: 'account' | 'security' | 'archived' = 'account';

  constructor() { }

  selectPage(page: 'account' | 'security' | 'archived') {
    this.activePage = page;
  }
}
