import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogContent, MatDialogActions, MatDialogTitle } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { StoryService } from '../../../core/services/story.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-create-story-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatInputModule, MatFormFieldModule, FormsModule, MatIconModule, MatDialogContent, MatDialogActions, MatDialogTitle],
  templateUrl: './create-story-modal.component.html',
  styleUrls: ['./create-story-modal.component.css']
})
export class CreateStoryModalComponent {
  private dialogRef = inject(MatDialogRef<CreateStoryModalComponent>);
  private storyService = inject(StoryService);

  contentUrl = '';
  caption = '';
  selectedFile: File | null = null;

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  createStory(): void {
    if (!this.selectedFile && !this.contentUrl) {
      // Handle error: no content provided
      return;
    }

    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('mediaFile', this.selectedFile, this.selectedFile.name);
    } else if (this.contentUrl) {
      // If contentUrl is provided, we might need to handle it differently on the backend
      // For this iteration, I will assume `contentUrl` is not directly supported by the current backend `createStory` endpoint
      // which expects a `MultipartFile`. So, I will only proceed if `selectedFile` is present.
      // If the user wants to support URL-based stories, the backend `createStory` method needs to be updated.
      console.warn('Backend createStory endpoint expects a file. contentUrl will be ignored if no file is selected.');
      return;
    }

    formData.append('caption', this.caption);

    this.storyService.createStory(formData).subscribe({
      next: (response) => {
        if (response.data) {
          this.dialogRef.close(true);
        }
      },
      error: (error) => {
        console.error('Error creating story:', error);
        // Handle error, show message to user
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
