import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ReelService } from '../../../core/services/reel.service';
import { ToastService } from '../../../core/services/toast.service';
import { AiService } from '../../../core/services/ai.service';
import { CloudinaryService } from '../../../core/services/cloudinary.service';
import { UploadService } from '../../../core/services/upload.service';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-create-reel-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule
  ],
  template: `
  <div class="modal-wrapper">
    <div class="modal-box">
      <h2 class="title">🎥 Create New Reel</h2>

      <form (ngSubmit)="createReel()" class="upload-form">

        <!-- ✏️ Caption -->
        <mat-form-field appearance="outline" class="input-full ai-container" [class.loading]="isGeneratingCaption">
          <mat-label>Write a caption...</mat-label>
          <textarea matInput [(ngModel)]="caption" name="caption" rows="3" required [readonly]="isGeneratingCaption"></textarea>
          <div *ngIf="isGeneratingCaption" class="shimmer"></div>
        </mat-form-field>

        <!-- 🤖 AI Caption -->
        <div class="ai-row">
          <mat-form-field appearance="outline" class="flex-grow">
            <mat-label>Prompt for AI caption</mat-label>
            <input matInput [(ngModel)]="aiCaptionPrompt" name="aiCaptionPrompt" />
          </mat-form-field>
          <button mat-raised-button color="accent" type="button" (click)="generateAutoCaption()" [disabled]="isGeneratingCaption">
            <span *ngIf="!isGeneratingCaption">✨ AI Caption</span>
            <span *ngIf="isGeneratingCaption">Magic...</span>
          </button>
        </div>

        <!-- 📂 File Input -->
        <div class="file-section">
          <input type="file" id="videoFile" (change)="onFileSelected($event)" accept="video/*" hidden />
          <label for="videoFile" class="upload-btn">
            <i class="fas fa-upload"></i>
            <span *ngIf="!selectedFile">Choose Video</span>
            <span *ngIf="selectedFile">{{ selectedFile.name }}</span>
          </label>
        </div>

        <!-- 🎞️ Video Preview -->
        <div *ngIf="videoPreviewUrl" class="video-preview">
          <video [src]="videoPreviewUrl" controls muted playsinline></video>
        </div>

        <!-- 🔒 Privacy -->
        <div class="private-toggle">
          <input type="checkbox" id="isPrivate" [(ngModel)]="isPrivate" name="isPrivate" />
          <label for="isPrivate">Private Reel (followers only)</label>
        </div>

        <!-- 🚀 Upload -->
        <button mat-raised-button color="primary" type="submit"
                class="upload-btn-main"
                [class.loading]="isUploading"
                [disabled]="!selectedFile || !caption || isGeneratingCaption || isUploading">
          <span *ngIf="!isUploading">Upload Reel</span>
          <span *ngIf="isUploading" class="loader"></span>
        </button>

        <button mat-button color="warn" type="button" (click)="closeModal()">Cancel</button>
      </form>
    </div>
  </div>
  `,
  styles: [`
  /* 🌌 Modal Layer */
  .modal-wrapper {
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(10,10,10,0.65);
    z-index: 50000;
    backdrop-filter: blur(8px);
    animation: fadeIn 0.3s ease;
  }

  .modal-box {
    background: var(--card-bg);
    color: var(--text-primary);
    width: 95%;
    max-width: 500px;
    border-radius: 18px;
    padding: 24px;
    box-shadow: 0 16px 50px rgba(0,0,0,0.4);
    animation: slideUp 0.35s ease;
    position: relative;
    overflow: hidden;
  }

  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(40px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .title {
    text-align: center;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 16px;
  }

  .upload-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  /* 🧠 AI Caption shimmer */
  .ai-container {
    position: relative;
  }
  .ai-container.loading textarea {
    color: transparent !important;
  }
  .shimmer {
    position: absolute;
    inset: 0;
    border-radius: 6px;
    background: linear-gradient(110deg, #f6f7f8 8%, #eaeaea 18%, #f6f7f8 33%);
    background-size: 200% 100%;
    animation: shimmerMove 1.2s infinite linear;
  }
  @keyframes shimmerMove {
    from { background-position: -200% 0; }
    to { background-position: 200% 0; }
  }

  /* 📂 File Button */
  .upload-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--primary-color);
    color: #fff;
    padding: 10px 16px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, background 0.3s;
  }
  .upload-btn:hover {
    background: var(--primary-hover);
    transform: translateY(-2px);
  }

  /* 🎞️ Video preview box */
  .video-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--input-bg);
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid var(--border-color);
    box-shadow: 0 0 12px rgba(0,0,0,0.25);
    transition: transform 0.2s;
    // aspect-ratio: 9/16;
  }
  .video-preview video {
    width: 200px;
    height: 200px;
    object-fit: cover;
  }
  .video-preview:hover {
    transform: scale(1.01);
  }

  /* 🔒 Privacy */
  .private-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  /* 🚀 Upload Button */
  .upload-btn-main {
    position: relative;
    width: 100%;
    font-weight: 700;
    border-radius: 10px;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  .upload-btn-main.loading {
    pointer-events: none;
    opacity: 0.9;
  }
  .loader {
    width: 26px;
    height: 26px;
    border: 3px solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    border-radius: 50%;
    display: inline-block;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .ai-row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  /* 🌗 Dark Mode */
  .dark-theme .modal-box {
    background: rgba(30,41,59,0.92);
    box-shadow: 0 16px 60px rgba(0,0,0,0.6);
  }
  .dark-theme .upload-btn {
    background: #2563eb;
  }
  .dark-theme .video-preview {
    border-color: rgba(255,255,255,0.08);
  }

  @media (max-width: 600px) {
    .modal-box {
      width: 100%;
      height: 100%;
      border-radius: 0;
      padding: 16px;
    }
  }
  `]
})
export class CreateReelModalComponent {
  @Output() closeModalEvent = new EventEmitter<void>();

  caption = '';
  selectedFile: File | null = null;
  videoPreviewUrl: string | ArrayBuffer | null = null;
  isPrivate = false;
  aiCaptionPrompt = '';
  isGeneratingCaption = false;
  isUploading = false;

  private reelService = inject(ReelService);
  private toastService = inject(ToastService);
  private aiService = inject(AiService);
  private cloudinaryService = inject(CloudinaryService);
  private uploadService = inject(UploadService);
  private dialog = inject(MatDialog);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

      if (file.size > MAX_SIZE) {
        this.toastService.show('Video file size cannot exceed 20MB.', 'error');
        this.selectedFile = null;
        this.videoPreviewUrl = null;
        input.value = ''; // Clear the input so the same file can be selected again
        return;
      }

      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => this.videoPreviewUrl = reader.result;
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.selectedFile = null;
      this.videoPreviewUrl = null;
    }
  }

  generateAutoCaption(): void {
    if (!this.aiCaptionPrompt) {
      this.toastService.show('Please enter a prompt.', 'error');
      return;
    }
    this.isGeneratingCaption = true;
    this.caption = '';

    this.aiService.autoCaption(this.aiCaptionPrompt).subscribe({
      next: res => {
        this.caption = res.caption;
        this.isGeneratingCaption = false;
      },
      error: err => {
        this.toastService.show(err.error?.message || 'Failed to generate caption.', 'error');
        this.isGeneratingCaption = false;
      }
    });
  }

  createReel(): void {
    if (!this.selectedFile || !this.caption) {
      this.toastService.show('Please select a video and enter a caption.', 'error');
      return;
    }

    this.isUploading = true;
    const thumbnailPreview = this.videoPreviewUrl as string;
    this.uploadService.startUpload(this.selectedFile.name, thumbnailPreview);
    this.closeModal();

    this.cloudinaryService.getSignature().subscribe(signature => {
      this.cloudinaryService.uploadVideo(this.selectedFile!, signature).subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadService.updateProgress({ loaded: event.loaded, total: event.total! });
        } else if (event.type === HttpEventType.Response) {
          const videoUrl = event.body.secure_url;
          const thumbnailUrl = this.generateThumbnailUrl(videoUrl);
          const publicId = event.body.public_id;
          
          this.reelService.saveReel({
            title: this.caption,
            description: this.caption,
            videoUrl,
            thumbnailUrl,
            publicId,
            uploadedBy: '' // This will be set by the backend
          }).subscribe({
            next: () => {
              this.uploadService.completeUpload();
              this.toastService.show('Reel uploaded successfully!', 'success');
              this.isUploading = false;
            },
            error: err => {
              this.uploadService.failUpload('Failed to save reel metadata.');
              this.toastService.show('Failed to save reel.', 'error');
              this.isUploading = false;
            }
          });
        }
      }, err => {
        this.uploadService.failUpload('Upload to Cloudinary failed.');
        this.toastService.show('Failed to upload video.', 'error');
        this.isUploading = false;
      });
    });
  }

  generateThumbnailUrl(videoUrl: string): string {
    return videoUrl.replace(/\.mp4$/, '.jpg');
  }

  closeModal(): void {
    this.closeModalEvent.emit();
  }
}
