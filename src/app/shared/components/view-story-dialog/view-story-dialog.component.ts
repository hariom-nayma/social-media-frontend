import { Component, Inject, OnInit, OnDestroy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { StoryDTO } from '../../../core/models/story.model';
import { StoryService } from '../../../core/services/story.service';
import { UserService } from '../../../core/services/user.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ShakaPlayerComponent } from '../shaka-player/shaka-player';

@Component({
  selector: 'app-view-story-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, ShakaPlayerComponent],
  templateUrl: './view-story-dialog.component.html',
  styleUrls: ['./view-story-dialog.component.css']
})
export class ViewStoryDialogComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<ViewStoryDialogComponent>);
  private storyService = inject(StoryService);
  private userService = inject(UserService);

  currentStory!: StoryDTO;
  stories: StoryDTO[];
  currentIndex = 0;
  currentStoryProgress = 0;
  videoDuration: number = 0;
  videoCurrentTime: number = 0;
  private viewedStories = new Set<number>(); // To track viewed stories

  constructor(@Inject(MAT_DIALOG_DATA) public data: { stories: StoryDTO[] }) {
    this.stories = data.stories;
    this.currentStory = this.stories[0];
  }

  ngOnInit(): void {
    this.startStoryPlayback();
  }

  ngOnDestroy(): void {
    // clearInterval(this.interval); // Removed
  }

  startStoryPlayback(): void {
    this.markStoryAsViewed();
    this.videoDuration = 0; // Reset for new story
    this.videoCurrentTime = 0; // Reset for new story
    this.currentStoryProgress = 0; // Reset progress bar
    // The progress will now be driven by ShakaPlayer events
  }

  markStoryAsViewed(): void {
    if (this.currentStory && !this.viewedStories.has(this.currentStory.id)) {
      this.storyService.viewStory(this.currentStory.id).subscribe(() => {
        this.viewedStories.add(this.currentStory!.id);
      });
    }
  }

  startProgress(): void {
    // This method will now be driven by videoTimeUpdate events
    if (this.videoDuration > 0) {
      this.currentStoryProgress = (this.videoCurrentTime / this.videoDuration) * 100;
    } else {
      this.currentStoryProgress = 0;
    }
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

  nextStory() {
    if (this.currentIndex < this.stories.length - 1) {
      this.currentIndex++;
      this.currentStory = this.stories[this.currentIndex];
      this.resetProgress();
      this.startStoryPlayback();
    } else {
      this.close();
    }
  }

  prevStory() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.currentStory = this.stories[this.currentIndex];
      this.resetProgress();
      this.startStoryPlayback();
    }
  }

  resetProgress(): void {
    this.videoDuration = 0;
    this.videoCurrentTime = 0;
    this.currentStoryProgress = 0;
  }

  isImage(url?: string): boolean {
    return !!url && /\.(jpeg|jpg|png|gif)$/i.test(url);
  }

  isVideo(url?: string): boolean {
    return !!url && /\.(mp4|webm|ogg|m3u8)$/i.test(url);
  }

  likeStory(): void {
    if (this.currentStory) {
      this.storyService.likeStory(this.currentStory.id).subscribe(() => {
        this.currentStory!.likedByme = !this.currentStory!.likedByme; // Optimistically toggle
      });
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
