import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserDTO } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { CommonModule } from '@angular/common';
import { ApiResponse } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-stream-call-list',
  templateUrl: './stream-call-list.component.html',
  styleUrls: ['./stream-call-list.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class StreamCallListComponent implements OnInit {
  users: UserDTO[] = [];
  currentUserId: string | undefined;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.userService.myMiniProfile().subscribe((response: ApiResponse<UserDTO>) => {
      if (response.data) {
        this.currentUserId = response.data.username;
      }
    });

    this.userService.getCurrentUserFollowers().subscribe((response: ApiResponse<UserDTO[]>) => {
      if (response.data) {
        this.users = response.data;
      }
    });
  }

  initiateCall(user: UserDTO) {
    if (this.currentUserId) {
      // create a unique call id, sorting user ids to ensure it's the same for both users
      const participants = [this.currentUserId, user.username].sort();
      const callId = participants.join('-');
      this.router.navigate(['/stream-call', callId]);
    } else {
      console.error('Current user ID not available');
    }
  }
}
