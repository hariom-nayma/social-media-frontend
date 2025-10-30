import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoryService } from '../../../core/services/story.service';
import { AuthService } from '../../../core/services/auth.service';
import { StoryDTO } from '../../../core/models/story.model';
import { UserDTO } from '../../../core/models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { CreateStoryModalComponent } from '../create-story-modal/create-story-modal.component';
import { UserService } from '../../../core/services/user.service';

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

  ngOnInit(): void {
    this.userService.myMiniProfile().subscribe({
      next: (response) => {
        if (response.data) {
          this.currentUser = response.data;
        }
      },
      error: (error) => {
        console.error('Error fetching mini profile:', error);
      }
    });
    this.fetchStories();
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

  openCreateStoryDialog(): void {
    const dialogRef = this.dialog.open(CreateStoryModalComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchStories();
      }
    });
  }

  viewStory(story: StoryDTO): void {
    console.log('Viewing story:', story);
  }
}
