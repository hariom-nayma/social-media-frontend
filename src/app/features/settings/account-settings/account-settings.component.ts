import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { UserDTO } from '../../../core/models/user.model';

@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.css'
})
export class AccountSettingsComponent implements OnInit {
  isPrivate: boolean = false;
  currentUser: UserDTO | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getMyProfile().subscribe(response => {
      if (response.data) {
        this.currentUser = response.data;
        this.isPrivate = this.currentUser.isPrivate;
      }
    });
  }

  onPrivacyToggle(): void {
    this.userService.toggleAccountPrivacy().subscribe(response => {
      if (response.data) {
        this.isPrivate = response.data.private;
        // Optionally, show a toast notification
      }
    });
  }
}
