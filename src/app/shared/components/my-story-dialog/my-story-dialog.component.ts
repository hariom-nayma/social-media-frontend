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
  selector: 'app-my-story-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './my-story-dialog.component.html',
  styleUrls: ['./my-story-dialog.component.css']
})
export class MyStoryDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<MyStoryDialogComponent>);
  private storyService = inject(StoryService);
  private userService = inject(UserService);

  stories: StoryDTO[] = [];
  currentStoryIndex = 0;
  currentStory: StoryDTO | null = null;
  likes: UserDTO[] = [];
  views: UserDTO[] = [];
  progress = 0;
  progressInterval: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { stories: StoryDTO[] }) {
    this.stories = data.stories || [];
    if (this.stories.length > 0) {
      this.currentStory = this.stories[0];
    }
  }

  ngOnInit(): void {
    this.loadStoryMetrics();
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
      this.loadStoryMetrics();
      this.resetProgress();
    }
  }

  prevStory(): void {
    if (this.currentStoryIndex > 0) {
      this.currentStoryIndex--;
      this.currentStory = this.stories[this.currentStoryIndex];
      this.loadStoryMetrics();
      this.resetProgress();
    }
  }

  /** Auto progress animation bar */
  startProgress(): void {
    this.progress = 0;
    console.log('Starting progress for story:', this.currentStory?.id);
    this.progressInterval = setInterval(() => {
      if (this.progress >= 100) {
        clearInterval(this.progressInterval);
        this.nextStory();
      } else {
        this.progress += 1;
        console.log('Progress:', this.progress);
      }
    }, 100); // story auto advances every ~10 seconds
  }

  resetProgress(): void {
    clearInterval(this.progressInterval);
    this.startProgress();
  }

  close(): void {
    clearInterval(this.progressInterval);
    this.dialogRef.close();
  }
}
