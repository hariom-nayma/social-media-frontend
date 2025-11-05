import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { UserDTO } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-followers-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './followers-dialog.component.html',
  styleUrls: ['./followers-dialog.component.css']
})
export class FollowersDialogComponent implements OnInit {
  users: (UserDTO & { isFollowing: boolean; isRequested: boolean })[] = [];
  title = '';
  currentUserId?: string;
  isFollowing = false;
  searchTerm = '';

  constructor(
    public dialogRef: MatDialogRef<FollowersDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { username: string; type: 'followers' | 'following'; isOwnProfile: boolean },
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.title = this.data.type === 'followers' ? 'Followers' : 'Following';
    this.userService.myMiniProfile().subscribe({
      next: (response) => (this.currentUserId = response.data?.id),
      error: (error) => console.error('Error fetching current user:', error),
    });
    this.loadUsers();
  }

  searchQuery = '';
filteredUsers: (UserDTO & { isFollowing: boolean; isRequested: boolean })[] = [];

loadUsers(): void {
  const mapUserData = (user: UserDTO) => ({
    ...user,
    isFollowing: user.following || false,
    isRequested: user.requested || false
  });

  const fetch$ = this.data.isOwnProfile
    ? (this.isFollowing
        ? this.userService.getOwnFollowing()
        : this.userService.getOwnFollowers())
    : (this.isFollowing
        ? this.userService.getFollowing(this.data.username)
        : this.userService.getFollowers(this.data.username));

  fetch$.subscribe(response => {
    this.users = response.data?.map(mapUserData) ?? [];
    this.filteredUsers = [...this.users];
  });
}

filterUsers(): void {
  const q = this.searchQuery.trim().toLowerCase();
  this.filteredUsers = this.users.filter(u =>
    u.username.toLowerCase().includes(q) ||
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
  );
}


  toggleTab(isFollowing: boolean): void {
    this.isFollowing = isFollowing;
    this.loadUsers();
  }

  // filteredUsers() {
  //   if (!this.searchTerm.trim()) return this.users;
  //   const term = this.searchTerm.toLowerCase();
  //   return this.users.filter(
  //     (u) =>
  //       u.username.toLowerCase().includes(term) ||
  //       (u.firstName && u.firstName.toLowerCase().includes(term)) ||
  //       (u.lastName && u.lastName.toLowerCase().includes(term))
  //   );
  // }


  // loadUsers(): void {
  //   const mapUserData = (user: UserDTO) => ({
  //     ...user,
  //     isFollowing: user.following || false,
  //     isRequested: user.requested || false
  //   });

  //   if (this.data.isOwnProfile) {
  //     if (this.isFollowing) {
  //       this.userService.getOwnFollowing().subscribe(response => {
  //         this.users = response.data?.map(mapUserData) ?? [];
  //       });
  //     } else {
  //       this.userService.getOwnFollowers().subscribe(response => {
  //         this.users = response.data?.map(mapUserData) ?? [];
  //       });
  //     }
  //   } else {
  //     if (this.isFollowing) {
  //       this.userService.getFollowing(this.data.username).subscribe(response => {
  //         this.users = response.data?.map(mapUserData) ?? [];
  //       });
  //     } else {
  //       this.userService.getFollowers(this.data.username).subscribe(response => {
  //         this.users = response.data?.map(mapUserData) ?? [];
  //       });
  //     }
  //   }
  // }

  toggleFollow(user: UserDTO & { isFollowing: boolean; isRequested: boolean }): void {
    if (user.private) {
      if (!user.isRequested) {
        this.userService.sendFollowRequest(user.userId).subscribe(() => {
          user.isRequested = true;
        });
      } else {
        this.userService.removeFollowRequest(user.userId).subscribe(() => {
          user.isRequested = false;
        });
      }
    } else {
      if (user.isFollowing) {
        this.userService.unfollowUser(user.userId).subscribe(() => {
          user.isFollowing = false;
        });
      } else {
        this.userService.followUser(user.userId).subscribe(() => {
          user.isFollowing = true;
        });
      }
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
