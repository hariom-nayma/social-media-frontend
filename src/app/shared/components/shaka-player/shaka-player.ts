import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  Output, // Added Output
  EventEmitter // Added EventEmitter
} from '@angular/core';
import shaka from 'shaka-player';

@Component({
  selector: 'app-shaka-player',
  templateUrl: './shaka-player.html',
  styleUrls: ['./shaka-player.css'],
  standalone: true,
})
export class ShakaPlayerComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() manifestUrl!: string;
  @Input() loopVideo: boolean = true; // New input
  @ViewChild('videoEl') videoElement!: ElementRef<HTMLVideoElement>;
  private player!: shaka.Player;

  @Output() videoDuration = new EventEmitter<number>(); // New
  @Output() videoTimeUpdate = new EventEmitter<number>(); // New
  @Output() videoEnded = new EventEmitter<void>(); // New

  ngAfterViewInit(): void {
    shaka.polyfill.installAll();
    if (shaka.Player.isBrowserSupported()) {
      this.initPlayer();
    } else {
      console.error('Browser not supported by Shaka Player.');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['manifestUrl'] && this.player) {
      this.loadManifest();
    }
  }

  ngOnDestroy(): void {
    this.player?.destroy();
  }

  private initPlayer(): void {
    this.player = new shaka.Player(this.videoElement.nativeElement);
    this.player.configure({
      abr: {
        enabled: true,
      },
    });

    // Explicitly set the loop property on the native video element
    this.videoElement.nativeElement.loop = this.loopVideo;

    // Add event listeners to the native video element
    this.videoElement.nativeElement.addEventListener('loadedmetadata', () => {
      const duration = this.videoElement.nativeElement.duration;
      console.log('ShakaPlayer: loadedmetadata - duration:', duration);
      this.videoDuration.emit(duration);
    });
    this.videoElement.nativeElement.addEventListener('timeupdate', () => {
      const currentTime = this.videoElement.nativeElement.currentTime;
      console.log('ShakaPlayer: timeupdate - currentTime:', currentTime);
      this.videoTimeUpdate.emit(currentTime);
    });
    this.videoElement.nativeElement.addEventListener('ended', () => {
      this.videoEnded.emit();
    });

    this.loadManifest();
  }

  private loadManifest(): void {
    this.player
      .load(this.manifestUrl)
      .then(() => {
        this.videoElement.nativeElement.play();
      })
      .catch((error: any) => {
        console.error('Error loading manifest or video', error);
      });
  }
}