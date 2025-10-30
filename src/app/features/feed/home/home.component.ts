import { Component, OnInit } from '@angular/core';
import { PostService } from '../../../core/services/post.service';
import { PostDTO } from '../../../core/models/post.model';
import { CommonModule } from '@angular/common';
import { StoryBarComponent } from '../../../shared/components/story-bar/story-bar.component';
import { Router } from '@angular/router';
import { PostCardComponent } from '../../../shared/components/post-card/post-card.component';
import { UserService } from '../../../core/services/user.service';
import { SuggestionUserDTO } from '../../../core/models/suggestion.model';
import { UserDTO } from '../../../core/models/user.model';
import { FollowRequestDTO } from '../../../core/models/follow-request.model';
import { PendingRequestsComponent } from '../pending-requests/pending-requests.component';
import { PostDetailsDialogComponent } from '../../../shared/components/post-details-dialog/post-details-dialog.component';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, StoryBarComponent, PostCardComponent, PendingRequestsComponent, PostDetailsDialogComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  posts: PostDTO[] = [];
  currentUser: UserDTO | undefined;
  suggestions: (SuggestionUserDTO & { isFollowing: boolean; isRequested: boolean })[] = [];
  pendingRequests: FollowRequestDTO[] = [];

  showPostDetailsDialog = false;
  selectedPostId: string | null = null;

  constructor(private postService: PostService, private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    this.postService.getFeed().subscribe(response => {
      this.posts = response.data ?? [];
    });

    this.userService.getFriendSuggestions().subscribe(response => {
      this.suggestions = response.data?.map(s => ({ ...s, isFollowing: false, isRequested: s.requested })) ?? [];
    });

    this.userService.myMiniProfile().subscribe(response => {
      this.currentUser = response.data;
      if (this.currentUser?.private) {
        this.userService.getPendingFollowRequests().subscribe(response => {
          this.pendingRequests = response.data ?? [];
        });
      }
    });
  }

  openPostDetailsDialog(postId: string) {
    this.selectedPostId = postId;
    this.showPostDetailsDialog = true;
  }

  closePostDetailsDialog() {
    this.showPostDetailsDialog = false;
    this.selectedPostId = null;
  }

  goToProfile(username: string): void {
    this.router.navigate(['/profile', username]);
  }

  toggleFollow(suggestion: SuggestionUserDTO & { isFollowing: boolean, isRequested: boolean }): void {
    if (suggestion.private) {
      if (!suggestion.isRequested) {
        this.userService.sendFollowRequest(suggestion.userId).subscribe(() => {
          suggestion.isRequested = true;
        });
      } else {
        this.userService.removeFollowRequest(suggestion.userId).subscribe(() => {
          suggestion.isRequested = false;
        });
      }
    } else {
      if (suggestion.isFollowing) {
        this.userService.unfollowUser(suggestion.userId).subscribe(() => {
          suggestion.isFollowing = false;
        });
      } else {
        this.userService.followUser(suggestion.userId).subscribe(() => {
          suggestion.isFollowing = true;
        });
      }
    }
  }
}
