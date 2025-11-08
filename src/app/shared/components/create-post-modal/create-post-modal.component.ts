import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidatorFn,
  FormsModule,
} from '@angular/forms';
import { PostService } from '../../../core/services/post.service';
import { CommonModule } from '@angular/common';
import { AiService } from '../../../core/services/ai.service';
import { ToastService } from '../../../core/services/toast.service';

export const contentOrMediaRequired: ValidatorFn = (
  control: AbstractControl
): Record<string, any> | null => {
  const content = control.get('content');
  const media = control.get('media');
  if (!content || !media) return null;
  if (!content.value && !media.value) {
    return { contentOrMediaRequired: true };
  }
  return null;
};

@Component({
  selector: 'app-create-post-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './create-post-modal.component.html',
  styleUrls: ['./create-post-modal.component.css'],
})
export class CreatePostModalComponent {
  @Output() closeModal = new EventEmitter<void>();

  postForm: FormGroup;
  aiCaptionPrompt = '';
  isGeneratingCaption = false;
  isUploading = false;
  mediaPreview: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private aiService: AiService,
    private toastService: ToastService
  ) {
    this.postForm = this.fb.group(
      {
        content: ['', Validators.maxLength(2200)],
        media: [null],
      },
      { validators: contentOrMediaRequired }
    );
  }

  generateAutoCaption() {
    if (!this.aiCaptionPrompt) {
      this.toastService.show('Please enter a prompt for the AI caption.', 'error');
      return;
    }

    this.isGeneratingCaption = true;
    this.postForm.controls['content'].setValue(''); // clear previous text

    this.aiService.autoCaption(this.aiCaptionPrompt).subscribe({
      next: (response) => {
        this.postForm.controls['content'].setValue(response.caption);
        this.isGeneratingCaption = false;
      },
      error: (err) => {
        this.toastService.show(
          err.error?.message || 'Failed to generate caption.',
          'error'
        );
        this.isGeneratingCaption = false;
      },
    });
  }

  onFileChange(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.postForm.patchValue({ media: file });
      this.postForm.get('media')?.updateValueAndValidity();

      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => (this.mediaPreview = e.target?.result || null);
      reader.readAsDataURL(file);
    } else {
      this.postForm.patchValue({ media: null });
      this.mediaPreview = null;
    }
  }

  submit() {
    this.postForm.markAllAsTouched();
    if (this.postForm.invalid) return;

    const formData = new FormData();
    const content = this.postForm.get('content')?.value;
    const media = this.postForm.get('media')?.value;
    if (content) formData.append('content', content);
    if (media) formData.append('media', media);

    this.isUploading = true;

    this.postService.createPost(formData).subscribe({
      next: () => {
        this.isUploading = false;
        this.closeModal.emit();
      },
      error: (err) => {
        this.isUploading = false;
        this.toastService.show(
          err.error?.message || 'Failed to upload post.',
          'error'
        );
      },
    });
  }
}
