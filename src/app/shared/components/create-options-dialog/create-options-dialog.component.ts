import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-create-options-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  template: `
    <div class="create-dialog-container">
      <h2 class="dialog-title">Create New</h2>

      <div class="options-container">
        <button class="option-btn post" (click)="selectOption('post')">
          <i class="fas fa-images"></i>
          <span>Create Post</span>
        </button>
        <button class="option-btn reel" (click)="selectOption('reel')">
          <i class="fas fa-video"></i>
          <span>Create Reel</span>
        </button>
      </div>

      <button class="cancel-btn" (click)="dialogRef.close()">Cancel</button>
    </div>
  `,
  styles: [`
    /* 🌐 Dialog Container */
    .create-dialog-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 28px 24px;
      background: var(--card-bg);
      border-radius: 20px;
      box-shadow: var(--shadow);
      color: var(--text-primary);
      transition: background 0.3s, color 0.3s;
      min-width: 340px;
      animation: fadeIn 0.25s ease;
    }

    /* ✨ Dialog Title */
    .dialog-title {
      font-size: 1.4rem;
      font-weight: 700;
      margin-bottom: 20px;
      text-align: center;
      color: var(--text-primary);
    }

    /* ⚙️ Options */
    .options-container {
      display: flex;
      flex-direction: column;
      gap: 14px;
      width: 100%;
      margin-bottom: 18px;
    }

    .option-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 12px 0;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      background: var(--primary-color);
      color: white;
      box-shadow: 0 4px 14px rgba(0,0,0,0.1);
      transition: transform 0.2s, background 0.25s;
    }

    .option-btn i {
      font-size: 1.2rem;
    }

    .option-btn:hover {
      transform: translateY(-2px);
      background: var(--primary-hover);
    }

    /* 🎬 Reel button variant */
    .option-btn.reel {
      background: linear-gradient(90deg, #ee0979, #ff6a00);
    }
    .option-btn.reel:hover {
      background: linear-gradient(90deg, #ff2a68, #ff8a00);
    }

    /* ❌ Cancel Button */
    .cancel-btn {
      margin-top: 10px;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-weight: 500;
      font-size: 0.95rem;
      cursor: pointer;
      transition: color 0.2s;
    }
    .cancel-btn:hover {
      color: var(--text-primary);
    }

    /* 🌗 Dark Mode */
    .dark-theme .create-dialog-container {
      background: rgba(30, 41, 59, 0.85);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }
    .dark-theme .cancel-btn {
      color: #a1a1aa;
    }

    /* 🎞️ Animation */
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    /* 📱 Responsive */
    @media (max-width: 480px) {
      .create-dialog-container {
        min-width: 90%;
        padding: 24px 16px;
      }
    }
  `]
})
export class CreateOptionsDialogComponent {
  constructor(public dialogRef: MatDialogRef<CreateOptionsDialogComponent>) {}

  selectOption(option: 'post' | 'reel'): void {
    this.dialogRef.close(option);
  }
}
