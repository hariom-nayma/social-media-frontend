import { Component, Inject, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { StoryDTO } from '../../../core/models/story.model';
import { UserDTO } from '../../../core/models/user.model';
import { StoryService } from '../../../core/services/story.service';
import { UserService } from '../../../core/services/user.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-my-story-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './my-story-dialog.component.html',
  styleUrls: ['./my-story-dialog.component.css']
})
export class MyStoryDialogComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<MyStoryDialogComponent>);
  private storyService = inject(StoryService);
  private userService = inject(UserService);

  stories: StoryDTO[] = [];
  currentStoryIndex: number = 0;
  currentStory: StoryDTO | null = null;
  likes: UserDTO[] = [];
  views: UserDTO[] = [];
  currentStoryProgress: number = 0;
  progressInterval: any;
  private viewedStories = new Set<number>(); // To track viewed stories

  constructor(@Inject(MAT_DIALOG_DATA) public data: { stories: StoryDTO[] }) {
    this.stories = data.stories || [];
    if (this.stories.length > 0) {
      this.currentStory = this.stories[0];
    }
  }

  ngOnInit(): void {
    this.startStoryPlayback();
  }

  ngOnDestroy(): void {
    clearInterval(this.progressInterval);
  }

  startStoryPlayback(): void {
    this.loadStoryMetrics();
    this.markStoryAsViewed();
    this.startProgress();
  }

  loadStoryMetrics(): void {
    if (!this.currentStory) return;

    this.storyService.getStoryLikes(this.currentStory.id).subscribe(response => {
      this.likes = response.data || [];
    });

    this.storyService.getStoryViews(this.currentStory.id).subscribe(response => {
      this.views = response.data || [];
    });
  }

  markStoryAsViewed(): void {
    if (this.currentStory && !this.viewedStories.has(this.currentStory.id)) {
      this.storyService.viewStory(this.currentStory.id).subscribe(() => {
        this.viewedStories.add(this.currentStory!.id);
      });
    }
  }

  /** Safely check if URL is an image */
  isImage(url?: string): boolean {
    if (!url) return false;
    return /\.(jpeg|jpg|png|gif)$/i.test(url);
  }

  /** Safely check if URL is a video */
  isVideo(url?: string): boolean {
    if (!url) return false;
    return /\.(mp4|webm|ogg)$/i.test(url);
  }

  nextStory(): void {
    if (this.currentStoryIndex < this.stories.length - 1) {
      this.currentStoryIndex++;
      this.currentStory = this.stories[this.currentStoryIndex];
      this.resetProgress();
      this.startStoryPlayback();
    } else {
      this.close(); // Close dialog if no more stories
    }
  }

  prevStory(): void {
    if (this.currentStoryIndex > 0) {
      this.currentStoryIndex--;
      this.currentStory = this.stories[this.currentStoryIndex];
      this.resetProgress();
      this.startStoryPlayback();
    }
  }

  /** Auto progress animation bar */
  startProgress(): void {
    this.currentStoryProgress = 0;
    clearInterval(this.progressInterval); // Clear any existing interval
    this.progressInterval = setInterval(() => {
      if (this.currentStoryProgress >= 100) {
        clearInterval(this.progressInterval);
        this.nextStory();
      } else {
        this.currentStoryProgress += 1;
      }
    }, 100); // story auto advances every ~10 seconds
  }

  resetProgress(): void {
    clearInterval(this.progressInterval);
    this.currentStoryProgress = 0;
  }

  close(): void {
    clearInterval(this.progressInterval);
    this.dialogRef.close();
  }
}
