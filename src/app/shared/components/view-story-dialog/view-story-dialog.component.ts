import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { StoryDTO } from '../../../core/models/story.model';
import { UserDTO } from '../../../core/models/user.model';
import { StoryService } from '../../../core/services/story.service';
import { UserService } from '../../../core/services/user.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-view-story-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './view-story-dialog.component.html',
  styleUrls: ['./view-story-dialog.component.css']
})
export class ViewStoryDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ViewStoryDialogComponent>);
  private storyService = inject(StoryService);
  private userService = inject(UserService);

  story: StoryDTO;
  currentUser: UserDTO | null = null;
  isMyStory: boolean = false;
  likes: UserDTO[] = [];
  views: UserDTO[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data: { story: StoryDTO }) {
    this.story = data.story;
  }

  ngOnInit(): void {
    this.userService.myMiniProfile().subscribe(response => {
      if (response.data) {
        this.currentUser = response.data;
        this.isMyStory = this.currentUser.userId === this.story.userId;
        if (this.isMyStory) {
          this.getStoryMetrics();
        }
      }
    });

    // Mark story as viewed
    if (!this.isMyStory) { // Only view other people's stories
      this.storyService.viewStory(this.story.id).subscribe();
    }
  }

  getStoryMetrics(): void {
    this.storyService.getStoryLikes(this.story.id).subscribe(response => {
      if (response.data) {
        this.likes = response.data;
      }
    });
    this.storyService.getStoryViews(this.story.id).subscribe(response => {
      if (response.data) {
        this.views = response.data;
      }
    });
  }

  likeStory(): void {
    this.storyService.likeStory(this.story.id).subscribe(() => {
      this.story.likedByme = !this.story.likedByme; // Optimistically toggle
      if (this.isMyStory) {
        this.getStoryMetrics(); // Re-fetch metrics to update like count if it's my story
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
