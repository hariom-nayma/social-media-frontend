import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogContent, MatDialogActions, MatDialogTitle } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { StoryService } from '../../../core/services/story.service';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from '../../../core/services/toast.service';
import { CloudinaryService } from '../../../core/services/cloudinary.service';
import { UploadService } from '../../../core/services/upload.service';
import { HttpEventType } from '@angular/common/http';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable } from 'rxjs/internal/Observable';

@Component({
  selector: 'app-create-story-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './create-story-modal.component.html',
  styleUrls: ['./create-story-modal.component.css']
})
export class CreateStoryModalComponent {
  private dialogRef = inject(MatDialogRef<CreateStoryModalComponent>);
  private storyService = inject(StoryService);
  private toastService = inject(ToastService);
  private cloudinaryService = inject(CloudinaryService);
  private uploadService = inject(UploadService);

  caption = '';
  selectedFile: File | null = null;
  filePreviewUrl: string | ArrayBuffer | null = null;
  isUploading = false;
  uploadProgress = 0;
  uploadSpeed = '0 KB/s';
  uploadStartTime: number | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20 MB
      const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

      if (file.type.startsWith('video/')) {
        if (file.size > MAX_VIDEO_SIZE) {
          this.toastService.show('Video file size cannot exceed 20MB.', 'error');
          this.selectedFile = null;
          this.filePreviewUrl = null;
          input.value = '';
          return;
        }
      } else if (file.type.startsWith('image/')) {
        if (file.size > MAX_IMAGE_SIZE) {
          this.toastService.show('Image file size cannot exceed 10MB.', 'error');
          this.selectedFile = null;
          this.filePreviewUrl = null;
          input.value = '';
          return;
        }
      } else {
        this.toastService.show('Unsupported file type. Please select an image or video.', 'error');
        this.selectedFile = null;
        this.filePreviewUrl = null;
        input.value = '';
        return;
      }

      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => this.filePreviewUrl = reader.result;
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.selectedFile = null;
      this.filePreviewUrl = null;
    }
  }

  createStory(): void {
    if (!this.selectedFile || !this.caption) {
      this.toastService.show('Please select a file and enter a caption.', 'error');
      return;
    }

    this.isUploading = true;
    this.uploadService.startUpload(this.selectedFile.name, this.filePreviewUrl as string);
    this.dialogRef.close(); // Close modal immediately, upload progress shown elsewhere

    this.cloudinaryService.getSignature().subscribe(signature => {
      let uploadObservable: Observable<any>;
      const isImage = this.selectedFile!.type.startsWith('image/');

      if (isImage) {
        // Upload image first
        uploadObservable = this.cloudinaryService.uploadImage(this.selectedFile!, signature);
      } else {
        // Upload video directly
        uploadObservable = this.cloudinaryService.uploadVideo(this.selectedFile!, signature);
      }

      uploadObservable.subscribe({
        next: event => {
          if (event.type === HttpEventType.UploadProgress) {
            this.uploadService.updateProgress({ loaded: event.loaded, total: event.total! });
          } else if (event.type === HttpEventType.Response) {
            const publicId = event.body.public_id;
            let videoUrl: string;
            // thumbnailUrl is not sent to backend, but generated for potential frontend use or future backend updates.
            // let thumbnailUrl: string; 

            if (isImage) {
              // To transform an image into a video, the resource type in the URL should be 'image'
              // and then apply video transformations.
              // videoUrl = `https://res.cloudinary.com/${signature.cloudName}/image/upload/e_loop:15,c_fill,w_600,h_600/${publicId}.mp4`;
              videoUrl = `https://res.cloudinary.com/${signature.cloudName}/image/upload/w_600,h_600,c_fill/${publicId}.jpg`;
            } else {
              videoUrl = `https://res.cloudinary.com/${signature.cloudName}/video/upload/sp_auto/${publicId}.m3u8`;
              // thumbnailUrl = this.generateThumbnailUrl(publicId, signature.cloudName);
            }

            this.storyService.createStory({
              caption: this.caption,
              videoUrl: videoUrl,
              publicId: publicId
            }).subscribe({
              next: () => {
                this.uploadService.completeUpload();
                this.toastService.show('Story uploaded successfully!', 'success');
                this.isUploading = false;
              },
              error: _err => {
                this.uploadService.failUpload('Failed to save story metadata.');
                this.toastService.show(_err.error?.message || 'Failed to save story.', 'error');
                this.isUploading = false;
              }
            });
          }
        },
        error: _err => {
          this.uploadService.failUpload('Upload to Cloudinary failed.');
          this.toastService.show('Failed to upload file.', 'error');
          this.isUploading = false;
        }
      });
    }, _err => {
      this.toastService.show('Failed to get Cloudinary signature.', 'error');
      this.isUploading = false;
    });
  }

  generateThumbnailUrl(publicId: string, cloudName: string): string {
    return `https://res.cloudinary.com/${cloudName}/video/upload/${publicId}.jpg`;
  }

  close(): void {
    this.dialogRef.close();
  }
}
