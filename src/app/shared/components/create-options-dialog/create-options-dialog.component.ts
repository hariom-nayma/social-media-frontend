import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-create-options-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Create New</h2>
    <mat-dialog-content>
      <div class="flex flex-col space-y-4">
        <button mat-raised-button color="primary" (click)="selectOption('post')">Create Post</button>
        <button mat-raised-button color="accent" (click)="selectOption('reel')">Create Reel</button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .mat-dialog-container {
      padding: 20px;
    }
    .mat-dialog-title {
      margin-bottom: 20px;
      font-size: 1.5rem;
      font-weight: bold;
    }
    .mat-dialog-content {
      padding: 0 24px 20px 24px;
    }
    .mat-dialog-actions {
      padding: 0 24px 20px 24px;
    }
    button {
      width: 100%;
      padding: 12px 0;
      font-size: 1.1rem;
    }
  `]
})
export class CreateOptionsDialogComponent {

  constructor(public dialogRef: MatDialogRef<CreateOptionsDialogComponent>) { }

  selectOption(option: 'post' | 'reel'): void {
    this.dialogRef.close(option);
  }
}
