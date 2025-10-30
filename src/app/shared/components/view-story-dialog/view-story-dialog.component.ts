import { Component, Inject, OnInit, OnDestroy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { StoryDTO } from '../../../core/models/story.model';
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
export class ViewStoryDialogComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<ViewStoryDialogComponent>);
  private storyService = inject(StoryService);
  private userService = inject(UserService);

  currentStory!: StoryDTO;
  stories: StoryDTO[];
  currentIndex = 0;
  currentStoryProgress = 0;
  interval: any;
  private viewedStories = new Set<number>(); // To track viewed stories

  constructor(@Inject(MAT_DIALOG_DATA) public data: { stories: StoryDTO[] }) {
    this.stories = data.stories;
    this.currentStory = this.stories[0];
  }

  ngOnInit(): void {
    this.startStoryPlayback();
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  startStoryPlayback(): void {
    this.markStoryAsViewed();
    this.startProgress();
  }

  markStoryAsViewed(): void {
    if (this.currentStory && !this.viewedStories.has(this.currentStory.id)) {
      this.storyService.viewStory(this.currentStory.id).subscribe(() => {
        this.viewedStories.add(this.currentStory!.id);
      });
    }
  }

  startProgress() {
    this.currentStoryProgress = 0;
    clearInterval(this.interval); // Clear any existing interval
    this.interval = setInterval(() => {
      if (this.currentStoryProgress >= 100) {
        clearInterval(this.interval);
        this.nextStory();
      } else {
        this.currentStoryProgress += 1;
      }
    }, 100); // story auto advances every ~10 seconds
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
    clearInterval(this.interval);
    this.currentStoryProgress = 0;
  }

  isImage(url?: string): boolean {
    return !!url && /\.(jpeg|jpg|png|gif)$/i.test(url);
  }

  isVideo(url?: string): boolean {
    return !!url && /\.(mp4|webm|ogg)$/i.test(url);
  }

  likeStory(): void {
    if (this.currentStory) {
      this.storyService.likeStory(this.currentStory.id).subscribe(() => {
        this.currentStory!.likedByme = !this.currentStory!.likedByme; // Optimistically toggle
      });
    }
  }

  close(): void {
    clearInterval(this.interval);
    this.dialogRef.close();
  }
}
