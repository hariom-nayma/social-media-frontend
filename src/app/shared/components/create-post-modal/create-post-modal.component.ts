import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { PostService } from '../../../core/services/post.service';
import { CommonModule } from '@angular/common';

export const contentOrMediaRequired: ValidatorFn = (control: AbstractControl): Record<string, any> | null => {
  const content = control.get('content');
  const media = control.get('media');

  if (!content || !media) {
    return null;
  }

  if (!content.value && !media.value) {
    return { 'contentOrMediaRequired': true };
  }
  return null;
};


@Component({
  selector: 'app-create-post-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-post-modal.component.html',
  styleUrls: ['./create-post-modal.component.css']
})
export class CreatePostModalComponent {
  postForm: FormGroup;
  @Output() closeModal = new EventEmitter<void>();

  constructor(private fb: FormBuilder, private postService: PostService) {
    this.postForm = this.fb.group({
      content: ['', Validators.maxLength(2200)],
      media: [null]
    }, { validators: contentOrMediaRequired });
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.postForm.patchValue({
        media: file
      });
      this.postForm.get('media')?.updateValueAndValidity();
    } else {
      this.postForm.patchValue({
        media: null
      });
      this.postForm.get('media')?.updateValueAndValidity();
    }
  }

  submit() {
    this.postForm.markAllAsTouched();

    if (this.postForm.invalid) {
      console.log('Form is invalid', this.postForm.errors);
      return;
    }

    const formData = new FormData();
    if (this.postForm.get('content')?.value) {
      formData.append('content', this.postForm.get('content')?.value);
    }
    if(this.postForm.get('media')?.value) {
      formData.append('media', this.postForm.get('media')?.value);
    }

    this.postService.createPost(formData).subscribe(() => {
      this.closeModal.emit();
    });
  }
}
