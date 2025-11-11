import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
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
  @ViewChild('videoEl') videoElement!: ElementRef<HTMLVideoElement>;
  private player!: shaka.Player;

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