import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface UploadState {
  progress: number;
  speed: number; // in KB/s
  fileName: string;
  thumbnailUrl?: string;
  inProgress: boolean;
  isComplete: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private uploadState = new BehaviorSubject<UploadState | null>(null);
  uploadState$ = this.uploadState.asObservable();

  private startTime!: number;
  private loadedBytes!: number;

  startUpload(fileName: string, thumbnailUrl?: string) {
    this.startTime = Date.now();
    this.loadedBytes = 0;
    this.uploadState.next({
      progress: 0,
      speed: 0,
      fileName,
      thumbnailUrl,
      inProgress: true,
      isComplete: false
    });
  }

  updateProgress(progressEvent: { loaded: number, total: number }) {
    const now = Date.now();
    const elapsedSeconds = (now - this.startTime) / 1000;
    const loadedKB = progressEvent.loaded / 1024;
    const speed = elapsedSeconds > 0 ? loadedKB / elapsedSeconds : 0;

    this.uploadState.next({
      ...this.uploadState.value!,
      progress: Math.round((progressEvent.loaded / progressEvent.total) * 100),
      speed: Math.round(speed)
    });
    this.loadedBytes = progressEvent.loaded;
  }

  completeUpload() {
    this.uploadState.next({
      ...this.uploadState.value!,
      inProgress: false,
      isComplete: true,
      progress: 100
    });
    // Reset after a delay to allow components to show completion status
    setTimeout(() => this.reset(), 5000);
  }

  failUpload(error: string) {
    this.uploadState.next({
      ...this.uploadState.value!,
      inProgress: false,
      isComplete: false,
      error
    });
  }

  reset() {
    this.uploadState.next(null);
  }
}
