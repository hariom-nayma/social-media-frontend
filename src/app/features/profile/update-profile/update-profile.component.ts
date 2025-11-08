import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { UserService } from '../../../core/services/user.service';
import { UserDTO } from '../../../core/models/user.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AiService } from '../../../core/services/ai.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-update-profile',
  templateUrl: './update-profile.component.html',
  styleUrls: ['./update-profile.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatIconModule,
    FormsModule
  ]
})
export class UpdateProfileComponent implements OnInit {
  updateProfileForm: FormGroup;
  selectedFile: File | null = null;
  aiBioPrompt: string = '';
  isGeneratingBio: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<UpdateProfileComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: UserDTO },
    private fb: FormBuilder,
    private userService: UserService,
    private aiService: AiService,
    private toastService: ToastService
  ) {
    this.updateProfileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      bio: ['']
    });
  }

  ngOnInit(): void {
    if (this.data.user) {
      this.updateProfileForm.patchValue({
        firstName: this.data.user.firstName,
        lastName: this.data.user.lastName,
        bio: this.data.user.bio
      });
    }
  }

  generateAutoBio() {
    if (!this.aiBioPrompt) {
      this.toastService.show('Please enter a prompt for the AI bio.', 'error');
      return;
    }

    this.isGeneratingBio = true;
    this.aiService.autoBio(this.aiBioPrompt).subscribe({
      next: (response) => {
        this.updateProfileForm.controls['bio'].setValue(response.bio);
        this.isGeneratingBio = false;
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Failed to generate bio.', 'error');
        this.isGeneratingBio = false;
      }
    });
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  onUpload(): void {
    if (this.selectedFile) {
      this.userService.updateProfileImage(this.selectedFile).subscribe(response => {
        this.data.user.profileImageUrl = response.data.profileImageUrl;
        this.dialogRef.close(this.data.user);
      });
    }
  }

  onSave(): void {
    if (this.updateProfileForm.valid) {
      this.userService.updateProfile(this.updateProfileForm.value).subscribe(updatedUser => {
        // Close and return updated user to parent component
        this.dialogRef.close(updatedUser);

        // Optionally refresh after save
        setTimeout(() => window.location.reload(), 10);
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
