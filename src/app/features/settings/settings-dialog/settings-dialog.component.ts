import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { AccountSettings } from '../account-settings/account-settings.component';
import { SecuritySettingsComponent } from '../security-settings/security-settings.component';


@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, AccountSettings, SecuritySettingsComponent],
  templateUrl: './settings-dialog.html',
  styleUrls: ['./settings-dialog.css']
})
export class SettingsDialogComponent {
  activePage: 'account' | 'security' = 'account';

  constructor() { }

  selectPage(page: 'account' | 'security') {
    this.activePage = page;
  }
}
