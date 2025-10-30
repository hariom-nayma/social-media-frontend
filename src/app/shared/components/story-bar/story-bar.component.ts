import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoryService } from '../../../core/services/story.service';
import { AuthService } from '../../../core/services/auth.service';
import { StoryDTO } from '../../../core/models/story.model';
import { UserDTO } from '../../../core/models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { CreateStoryModalComponent } from '../create-story-modal/create-story-modal.component';
import { UserService } from '../../../core/services/user.service';
import { ViewStoryDialogComponent } from '../view-story-dialog/view-story-dialog.component';
import { MyStoryDialogComponent } from '../my-story-dialog/my-story-dialog.component';

@Component({
  selector: 'app-story-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './story-bar.component.html',
  styleUrls: ['./story-bar.component.css']
})
export class StoryBarComponent implements OnInit {
  private storyService = inject(StoryService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private dialog = inject(MatDialog);

  currentUser: UserDTO | null = null;
  stories: StoryDTO[] = [];
  myStories: StoryDTO[] = [];
  hasMyStories: boolean = false;

  ngOnInit(): void {
    this.userService.myMiniProfile().subscribe({
      next: (response) => {
        if (response.data) {
          this.currentUser = response.data;
          this.fetchMyStories();
        }
      },
      error: (error) => {
        console.error('Error fetching mini profile:', error);
      }
    });
    this.fetchStories();
  }

  fetchMyStories(): void {
    // if (this.currentUser?.userId) {
      this.storyService.getMyStories().subscribe({
        next: (response) => {
          if (response.data) {
            this.myStories = response.data;
            this.hasMyStories = this.myStories.length > 0;
          }
        },
        error: (error) => {
          console.error('Error fetching my stories:', error);
        }
      });
    // }
  }

  fetchStories(): void {
    this.storyService.getStoriesForFeed().subscribe({
      next: (response) => {
        if (response.data) {
          this.stories = response.data;
        }
      },
      error: (error) => {
        console.error('Error fetching stories:', error);
      }
    });
  }

  openCreateStoryDialog(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const dialogRef = this.dialog.open(CreateStoryModalComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchStories();
        this.fetchMyStories(); // Re-fetch my stories after creating a new one
      }
    });
  }

  handleMyStoryClick(): void {
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

  viewStory(story: StoryDTO): void {
    this.dialog.open(ViewStoryDialogComponent, {
      data: { story: story },
      width: '600px',
      height: '90vh',
      maxWidth: '90vw'
    });
  }
}
