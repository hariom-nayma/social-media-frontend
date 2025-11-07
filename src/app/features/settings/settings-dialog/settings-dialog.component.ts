import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AccountSettingsComponent } from '../account-settings/account-settings.component';
import { SecuritySettingsComponent } from '../security-settings/security-settings.component';
import { ArchivedPostsComponent } from '../archived-posts/archived-posts.component';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { TwoFactorSettingsComponent } from '../two-factor-settings/two-factor-settings.component';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, AccountSettingsComponent, SecuritySettingsComponent, ArchivedPostsComponent, TwoFactorSettingsComponent], // Added TwoFactorSettingsComponent
  templateUrl: './settings-dialog.html',
  styleUrl: './settings-dialog.css'
})
export class SettingsDialogComponent implements OnInit {
  activePage: 'account' | 'security' | 'two-factor' | 'archived' = 'account'; // Added 'two-factor'

  constructor(public dialogRef: MatDialogRef<SettingsDialogComponent>) { }

  ngOnInit(): void {
  }

  selectPage(page: 'account' | 'security' | 'two-factor' | 'archived'): void { // Updated type
    this.activePage = page;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
