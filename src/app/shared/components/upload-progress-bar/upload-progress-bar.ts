import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { UploadService, UploadState } from '../../../core/services/upload.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload-progress-bar',
  templateUrl: './upload-progress-bar.html',
  styleUrls: ['./upload-progress-bar.css'],
  standalone: true,
  imports: [CommonModule]
})
export class UploadProgressBarComponent implements OnInit, OnDestroy {
  uploadState: UploadState | null = null;
  private subscription!: Subscription;

  constructor(private uploadService: UploadService) {}

  ngOnInit() {
    this.subscription = this.uploadService.uploadState$.subscribe(state => {
      this.uploadState = state;
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}