import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserDTO } from '../../../core/models/user.model';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { UpdateProfileComponent } from '../update-profile/update-profile.component';
import { AuthService } from '../../../core/services/auth.service';
import { FollowersDialogComponent } from '../../../shared/components/followers-dialog/followers-dialog.component';
import { PostDetailsDialogComponent } from '../../../shared/components/post-details-dialog/post-details-dialog.component';
import { PostService } from '../../../core/services/post.service';
import { FeedPostResponseDTO } from '../../../core/models/post.model';
import { UserService } from '../../../core/services/user.service';
import { ReelService } from '../../../core/services/reel.service';
import { ReelDTO } from '../../../core/models/reel.model';
import { ReelDetailsDialogComponent } from '../../../shared/components/reel-details-dialog/reel-details-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../../core/services/chat.service';
import { Router } from '@angular/router';
import { ChatComponent } from '../../chat/chat.component';
import { ChatDialogComponent } from '../../../shared/components/chat-dialog/chat-dialog';

@Component({
  selector: 'app-view-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './view-profile.component.html',
  styleUrl: './view-profile.component.css'
})
export class ViewProfileComponent implements OnInit {

  userProfile: (UserDTO & { isFollowing: boolean; isRequested: boolean; isBlockedByMe: boolean }) | undefined;
  username: string | null = null;
  isOwnProfile = false;
  showMoreOptions = false; // New property
  savedPosts: FeedPostResponseDTO[] = [];
  userReels: ReelDTO[] = [];
  activeTab: 'posts' | 'saved' | 'reels' = 'posts';

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private dialog: MatDialog,
    private authService: AuthService,
    private postService: PostService,
    private reelService: ReelService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.username = params.get('username');
      if (this.username) {
        this.userService.getUserProfileByUsername(this.username).subscribe(response => {
          this.userProfile = { ...response.data!, isFollowing: response.data?.following || false, isRequested: response.data?.requested || false, isBlockedByMe: response.data?.blockedByMe || false };
          this.checkIfOwnProfile();
          this.loadUserReels();
        });
      }
      else{
        this.userService.getMyProfile().subscribe(response => {
          this.userProfile = { ...response.data!, isFollowing: response.data?.following || false, isRequested: response.data?.requested || false, isBlockedByMe: response.data?.blockedByMe || false };
          this.isOwnProfile = true;
          if (this.isOwnProfile) {
            this.loadSavedPosts();
          }
          this.loadUserReels();
        });
      }
    });
  }

  checkIfOwnProfile(): void {
    this.userService.getMyProfile().subscribe(response => {
      if (response.data?.username === this.username) {
        this.isOwnProfile = true;
        if (this.isOwnProfile) {
          this.loadSavedPosts();
        }
      }
    });
  }

  loadSavedPosts(): void {
    this.postService.getSavedPosts(0, 10).subscribe(response => {
      if (response.data) {
        this.savedPosts = response.data;
      }
    });
  }

  loadUserReels(): void {
    const usernameToFetch = this.username || this.userProfile?.username;
    if (usernameToFetch) {
      this.reelService.getReelsByUser(usernameToFetch).subscribe(response => {
        console.log('Reels API Response:', response);
        if (response.data && Array.isArray(response.data)) {
          this.userReels = response.data;
          console.log('User Reels loaded:', this.userReels);
        }
        else {
          this.userReels = [];
          console.log('User Reels is empty or not an array.');
        }
      });
    }
  }

  selectTab(tab: 'posts' | 'saved' | 'reels'): void {
    this.activeTab = tab;
    if (tab === 'saved' && this.savedPosts.length === 0) {
      this.loadSavedPosts();
    }
    else if (tab === 'reels' && this.userReels.length === 0) {
      this.loadUserReels();
    }
  }

  openUpdateProfileDialog(): void {
    const dialogRef = this.dialog.open(UpdateProfileComponent, {
      width: '400px',
      data: { user: this.userProfile }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userProfile = result;
      }
    });
  }

  openFollowersDialog(): void {
    if (!this.userProfile) return;
    this.dialog.open(FollowersDialogComponent, {
      width: '400px',
      data: { username: this.userProfile.username, type: 'followers', isOwnProfile: this.isOwnProfile }
    });
  }

  openFollowingDialog(): void {
    if (!this.userProfile) return;
    this.dialog.open(FollowersDialogComponent, {
      width: '400px',
      data: { username: this.userProfile.username, type: 'following', isOwnProfile: this.isOwnProfile }
    });
  }

  openPostDetailsDialog(postId: string): void {
    const dialogRef = this.dialog.open(PostDetailsDialogComponent, {
      width: '800px',
      data: { postId: postId },
      disableClose: false,
      panelClass: 'post-details-dialog-panel'
    });

    dialogRef.backdropClick().subscribe(() => {
      dialogRef.close();
    });
  }

  openReelDetailsDialog(reelId: string): void {
    const dialogRef = this.dialog.open(ReelDetailsDialogComponent, {
      width: '800px',
      data: { reelId: reelId },
      disableClose: false,
      panelClass: 'reel-details-dialog-panel'
    });

    dialogRef.backdropClick().subscribe(() => {
      dialogRef.close();
    });
  }

  toggleMoreOptions(): void {
    this.showMoreOptions = !this.showMoreOptions;
  }

  toggleFollow(): void {
    if (!this.userProfile) return;

    if (this.userProfile.private) {
      if (!this.userProfile.isRequested) {
        this.userService.sendFollowRequest(this.userProfile.id).subscribe(() => {
          if (this.userProfile) this.userProfile.isRequested = true;
        });
      } else {
        this.userService.removeFollowRequest(this.userProfile.id).subscribe(() => {
          if (this.userProfile) this.userProfile.isRequested = false;
        });
      }
    } else {
      if (this.userProfile.isFollowing) {
        this.userService.unfollowUser(this.userProfile.id).subscribe(() => {
          if (this.userProfile) this.userProfile.isFollowing = false;
        });
      } else {
        this.userService.followUser(this.userProfile.id).subscribe(() => {
          if (this.userProfile) this.userProfile.isFollowing = true;
        });
      }
    }
  }

  openChat(): void {
    if (!this.userProfile) return;

    this.chatService.findConversationId(this.userProfile.username).subscribe(
      (response: any) => {
        const conversationId = response.data || null;
        this.dialog.open(ChatDialogComponent, {
          width: '800px',
          height: '600px',
          panelClass: 'chat-dialog-container',
          data: {
            conversationId: conversationId,
            recipientUsername: this.userProfile?.username
          }
        });
      },
      (error: any) => {
        console.error('Error finding conversation ID:', error);
        // Optionally, show an error message to the user
      }
    );
  }

  toggleBlockUser(): void {
    if (!this.userProfile) return;

    if (this.userProfile.isBlockedByMe) {
      this.userService.unblockUser(this.userProfile.id).subscribe(() => {
        if (this.userProfile) {
          this.userProfile.isBlockedByMe = false;
          // Optionally, show a success toast
          // this.toastService.showSuccess('User unblocked successfully');
        }
      });
    } else {
      this.userService.blockUser(this.userProfile.id).subscribe(() => {
        if (this.userProfile) {
          this.userProfile.isBlockedByMe = true;
          // Optionally, show a success toast
          // this.toastService.showSuccess('User blocked successfully');
        }
      });
    }
    this.showMoreOptions = false; // Close the menu
  }

  copyProfileUrl(): void {
    if (this.userProfile) {
      const profileUrl = window.location.href;
      navigator.clipboard.writeText(profileUrl).then(() => {
        // Optionally, show a success toast
        // this.toastService.showSuccess('Profile URL copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy URL:', err);
        // Optionally, show an error toast
        // this.toastService.showError('Failed to copy URL');
      });
    }
    this.showMoreOptions = false; // Close the menu
  }

  // loadUserProfile(): void {
  //   if (this.username) {
  //       this.userService.getUserProfileByUsername(this.username).subscribe(response => {
  //         this.userProfile = { ...response.data!, isFollowing: response.data?.following || false, isRequested: response.data?.requested || false };
  //         this.checkIfOwnProfile();
  //       });
  //     }
  //     else{
  //       this.userService.getMyProfile().subscribe(response => {
  //         this.userProfile = { ...response.data!, isFollowing: response.data?.following || false, isRequested: response.data?.requested || false };
  //         this.isOwnProfile = true;
  //       });
  //     }
  // }

}
