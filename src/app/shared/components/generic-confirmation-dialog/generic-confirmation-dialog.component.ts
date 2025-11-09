import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface GenericConfirmationDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}

@Component({
  selector: 'app-generic-confirmation-dialog',
  templateUrl: './generic-confirmation-dialog.component.html',
  styleUrls: ['./generic-confirmation-dialog.component.css'],
  standalone: true
})
export class GenericConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<GenericConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GenericConfirmationDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
