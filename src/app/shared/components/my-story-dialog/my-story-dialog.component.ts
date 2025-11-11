import { Component, Inject, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { StoryDTO } from '../../../core/models/story.model';
import { UserDTO } from '../../../core/models/user.model';
import { StoryService } from '../../../core/services/story.service';
import { UserService } from '../../../core/services/user.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ShakaPlayerComponent } from '../shaka-player/shaka-player';
import { MatMenuModule } from '@angular/material/menu'; // New
import { ToastService } from '../../../core/services/toast.service'; // New

@Component({
  selector: 'app-my-story-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, ShakaPlayerComponent, MatMenuModule],
  templateUrl: './my-story-dialog.component.html',
  styleUrls: ['./my-story-dialog.component.css']
})
export class MyStoryDialogComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<MyStoryDialogComponent>);
  private storyService = inject(StoryService);
  private userService = inject(UserService);
  private toastService = inject(ToastService); // New

  stories: StoryDTO[] = [];
  currentStoryIndex = 0;
  currentStory: StoryDTO | null = null;
  likes: UserDTO[] = [];
  views: UserDTO[] = [];
  currentStoryProgress = 0;
  videoDuration: number = 0;
  videoCurrentTime: number = 0;
  currentUserId: string | null = null; // New
  private viewedStories = new Set<number>(); // To track viewed stories

  constructor(@Inject(MAT_DIALOG_DATA) public data: { stories: StoryDTO[] }) {
    this.stories = data.stories || [];
    if (this.stories.length > 0) {
      this.currentStory = this.stories[0];
    }
  }

  ngOnInit(): void {
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserId = user.id;
      }
    });
    this.startStoryPlayback();
  }

  ngOnDestroy(): void {
    // clearInterval(this.progressInterval); // Removed
  }

  deleteStory(storyId: number): void {
    this.storyService.deleteStory(storyId).subscribe({
      next: () => {
        this.toastService.show('Story deleted successfully!', 'success');
        // Remove the deleted story from the local array
        this.stories = this.stories.filter(story => story.id !== storyId);
        if (this.stories.length === 0) {
          this.close(); // Close dialog if no more stories
        } else if (this.currentStoryIndex >= this.stories.length) {
          this.currentStoryIndex = this.stories.length - 1;
          this.currentStory = this.stories[this.currentStoryIndex];
          this.startStoryPlayback();
        } else {
          this.currentStory = this.stories[this.currentStoryIndex];
          this.startStoryPlayback();
        }
      },
      error: (err) => {
        console.error('Error deleting story:', err);
        this.toastService.show('Failed to delete story.', 'error');
      }
    });
  }

  startStoryPlayback(): void {
    this.loadStoryMetrics();
    this.markStoryAsViewed();
    this.videoDuration = 0; // Reset for new story
    this.videoCurrentTime = 0; // Reset for new story
    this.currentStoryProgress = 0; // Reset progress bar
    // The progress will now be driven by ShakaPlayer events
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
    return /\.(mp4|webm|ogg|m3u8)$/i.test(url);
  }

  onVideoDuration(duration: number): void {
    this.videoDuration = duration;
    this.videoCurrentTime = 0; // Reset current time when new video loads
    this.startProgress(); // Update progress bar immediately
  }

  onVideoTimeUpdate(currentTime: number): void {
    this.videoCurrentTime = currentTime;
    this.startProgress();
  }

  onVideoEnded(): void {
    this.nextStory();
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
    // This method will now be driven by videoTimeUpdate events
    if (this.videoDuration > 0) {
      this.currentStoryProgress = (this.videoCurrentTime / this.videoDuration) * 100;
    } else {
      this.currentStoryProgress = 0;
    }
  }

  resetProgress(): void {
    // clearInterval(this.progressInterval); // Removed
    this.videoDuration = 0;
    this.videoCurrentTime = 0;
    this.currentStoryProgress = 0;
  }

  close(): void {
    // clearInterval(this.progressInterval); // Removed
    this.dialogRef.close();
  }
}
