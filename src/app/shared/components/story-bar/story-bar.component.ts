import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { StoryService } from '../../../core/services/story.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { CreateStoryModalComponent } from '../create-story-modal/create-story-modal.component';
import { ViewStoryDialogComponent } from '../view-story-dialog/view-story-dialog.component';
import { StoryDTO } from '../../../core/models/story.model';
import { UserDTO } from '../../../core/models/user.model';
import { MyStoryDialogComponent } from '../my-story-dialog/my-story-dialog.component';

@Component({
  selector: 'app-story-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './story-bar.component.html',
  styleUrls: ['./story-bar.component.css']
})
export class StoryBarComponent implements OnInit {
  private storyService = inject(StoryService);
  private userService = inject(UserService);
  private dialog = inject(MatDialog);

  currentUser: UserDTO | null = null;
  groupedStories: { username: string, profileImageUrl: string, stories: StoryDTO[], viewedByMe: boolean }[] = [];
  stories: StoryDTO[] = [];
  myStories: StoryDTO[] = [];
  hasMyStories = false;
  myStoriesLoading = true; // Add loading flag

  ngOnInit(): void {
    this.userService.myMiniProfile().subscribe({
      next: (response) => {
        if (response.data) {
          this.currentUser = response.data;
          console.log('StoryBar: Current User:', this.currentUser);
          this.fetchMyStories();
        }
      },
      error: (error) => {
        console.error('StoryBar: Error fetching mini profile:', error);
        this.myStoriesLoading = false; // Set loading to false on error
      }
    });
    this.fetchStories();
    this.fetchMyStories();
  }

  fetchMyStories(): void {
      this.myStoriesLoading = true; // Set loading to true before fetching
      this.storyService.getMyStories().subscribe({
        next: (response) => {
          if (response.data) {
            this.myStories = response.data;
            this.hasMyStories = this.myStories.length > 0;
            console.log('StoryBar: My Stories:', this.myStories);
            console.log('StoryBar: Has My Stories:', this.hasMyStories);
          }
          this.myStoriesLoading = false; // Set loading to false after fetching
        },
        error: (error) => {
          console.error('StoryBar: Error fetching my stories:', error);
          this.myStoriesLoading = false; // Set loading to false on error
        }
      });
    
  }

  handleMyStoryClick(): void {
    console.log('StoryBar: handleMyStoryClick called.');
    console.log('StoryBar: hasMyStories:', this.hasMyStories);
    if (this.myStoriesLoading) {
      console.log('StoryBar: My stories are still loading. Ignoring click.');
      return; // Prevent action if stories are still loading
    }

    if (this.hasMyStories) {
      this.dialog.open(MyStoryDialogComponent, {
        data: { stories: this.myStories },
        width: '420px',
        height: '700px',
        maxWidth: '90vw',
        panelClass: 'my-story-dialog-panel'
      });
    } else {
      this.openCreateStoryDialog();
    }
  }

  fetchStories(): void {
    this.storyService.getStoriesForFeed().subscribe({
      next: (res) => {
        if (res.data) {
          this.groupStoriesByUser(res.data);
        }
      }
    });
  }

  groupStoriesByUser(stories: StoryDTO[]): void {
    const grouped = stories.reduce((acc, story) => {
      const username = story.username;
      if (!acc[username]) {
        acc[username] = {
          username,
          profileImageUrl: story.profileImageUrl,
          stories: [],
          viewedByMe: story.viewedByMe
        };
      }
      acc[username].stories.push(story);
      return acc;
    }, {} as any);

    this.groupedStories = Object.values(grouped);
  }

  openCreateStoryDialog(event?: Event): void {
    event?.stopPropagation();
    const dialogRef = this.dialog.open(CreateStoryModalComponent, { width: '500px' });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.fetchStories();
    });
  }

  // handleMyStoryClick(): void {
  //   if (this.currentUser) {
  //     this.openCreateStoryDialog();
  //   }
  // }

  viewUserStories(username: string): void {
    const userStories = this.groupedStories.find(u => u.username === username)?.stories;
    if (userStories?.length) {
      this.dialog.open(ViewStoryDialogComponent, {
        data: { stories: userStories },
        width: '420px',
        height: '700px',
        panelClass: 'story-dialog-panel'
      });
    }
  }
}
