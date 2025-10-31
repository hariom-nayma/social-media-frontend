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

@Component({
  selector: 'app-view-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-profile.component.html',
  styleUrl: './view-profile.component.css'
})
export class ViewProfileComponent implements OnInit {

  userProfile: (UserDTO & { isFollowing: boolean; isRequested: boolean }) | undefined;
  username: string | null = null;
  isOwnProfile: boolean = false;
  savedPosts: FeedPostResponseDTO[] = [];
  activeTab: 'posts' | 'saved' = 'posts';

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private dialog: MatDialog,
    private authService: AuthService,
    private postService: PostService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.username = params.get('username');
      if (this.username) {
        this.userService.getUserProfileByUsername(this.username).subscribe(response => {
          this.userProfile = { ...response.data!, isFollowing: response.data?.following || false, isRequested: response.data?.requested || false };
          this.checkIfOwnProfile();
        });
      }
      else{
        this.userService.getMyProfile().subscribe(response => {
          this.userProfile = { ...response.data!, isFollowing: response.data?.following || false, isRequested: response.data?.requested || false };
          this.isOwnProfile = true;
          if (this.isOwnProfile) {
            this.loadSavedPosts();
          }
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

  selectTab(tab: 'posts' | 'saved'): void {
    this.activeTab = tab;
    if (tab === 'saved' && this.savedPosts.length === 0) {
      this.loadSavedPosts();
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
