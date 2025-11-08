import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ReelService } from '../../../core/services/reel.service';
import { ToastService } from '../../../core/services/toast.service';

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
          <!-- Caption -->
          <mat-form-field appearance="outline" class="input-full">
            <mat-label>Write a caption...</mat-label>
            <textarea
              matInput
              [(ngModel)]="caption"
              name="caption"
              rows="3"
              required
            ></textarea>
          </mat-form-field>

          <!-- File input -->
          <div class="file-section">
            <input
              type="file"
              id="videoFile"
              (change)="onFileSelected($event)"
              accept="video/*"
              hidden
            />
            <label for="videoFile" class="upload-btn">
              <span *ngIf="!selectedFile">📤 Choose Video</span>
              <span *ngIf="selectedFile">{{ selectedFile.name }}</span>
            </label>
          </div>

          <!-- Video preview -->
        <div *ngIf="videoPreviewUrl" class="mb-4 flex justify-center">
          <video [src]="videoPreviewUrl" controls class="max-w-full max-h-60 object-contain border rounded"></video>
        </div>
        <div class="mb-4 flex items-center">
          <input type="checkbox" id="isPrivate" [(ngModel)]="isPrivate" name="isPrivate" class="mr-2">
          <label for="isPrivate">Make Reel Private (only followers can see)</label>
        </div>
        <button mat-raised-button color="primary" type="submit" [disabled]="!selectedFile || !caption">Upload Reel</button>

          <button
            mat-button
            color="warn"
            type="button"
            (click)="closeModal()"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 9999;
      backdrop-filter: blur(2px);
      animation: fadeIn 0.2s ease-in-out;
    }

    .modal-box {
      background: #fff;
      border-radius: 16px;
      padding: 24px;
      width: 95%;
      max-width: 480px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      animation: slideUp 0.25s ease-in-out;
    }

    .title {
      text-align: center;
      font-size: 1.4rem;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .upload-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .input-full {
      width: 100%;
    }

    .file-section {
      text-align: center;
    }

    .upload-btn {
      display: inline-block;
      background: #0095f6;
      color: white;
      padding: 10px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .upload-btn:hover {
      background: #0078d7;
    }

    .video-preview {
      display: flex;
      justify-content: center;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 10px;
      background: #fafafa;
    }

    .preview-video {
      width: 100%;
      max-height: 250px;
      border-radius: 8px;
      object-fit: contain;
    }

    button[type="submit"] {
      width: 100%;
      padding: 12px;
      font-size: 1.05rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class CreateReelModalComponent {
  @Output() closeModalEvent = new EventEmitter<void>();

  caption = '';
  selectedFile: File | null = null;
  videoPreviewUrl: string | ArrayBuffer | null = null;
  isPrivate = false; // New property for public/private option

  private reelService = inject(ReelService);
  private toastService = inject(ToastService);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.videoPreviewUrl = reader.result;
      };
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.selectedFile = null;
      this.videoPreviewUrl = null;
    }
  }

  createReel(): void {
    if (this.selectedFile && this.caption) {
      this.reelService.createReel(this.selectedFile, this.caption, this.isPrivate).subscribe({
        next: (response) => {
          this.toastService.show('Reel created successfully!', 'success');
          this.closeModal();
        },
        error: (err) => {
          this.toastService.show('Failed to create reel.', 'error');
          console.error('Error creating reel:', err);
        }
      });
    } else {
      this.toastService.show('Please select a video and add a caption.', 'error');
    }
  }

  closeModal(): void {
    this.closeModalEvent.emit();
  }
}
