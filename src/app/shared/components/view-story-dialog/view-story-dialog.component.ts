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

  constructor(@Inject(MAT_DIALOG_DATA) public data: { story: StoryDTO }) {
    this.story = data.story;
    console.log('Story data in dialog:', this.story);
  }

  ngOnInit(): void {
    this.userService.myMiniProfile().subscribe(response => {
      if (response.data) {
        this.currentUser = response.data;
        console.log('Current user in dialog:', this.currentUser);
      }
    });

    // Mark story as viewed
    this.storyService.viewStory(this.story.id).subscribe();
  }

  likeStory(): void {
    this.storyService.likeStory(this.story.id).subscribe(() => {
      this.story.likedByme = !this.story.likedByme; // Optimistically toggle
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
