import {
  Component,
  OnInit,
  ElementRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
  OnDestroy,
  Renderer2
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReelService } from '../../../core/services/reel.service';
import { ReelDTO } from '../../../core/models/reel.model';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ShareDialogComponent } from '../../../shared/components/share-dialog/share-dialog.component';
import { ReelDetailsDialogComponent } from '../../../shared/components/reel-details-dialog/reel-details-dialog.component';

@Component({
  selector: 'app-reels-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reels-list.component.html',
  styleUrls: ['./reels-list.component.css']
})
export class ReelsListComponent implements OnInit, AfterViewInit, OnDestroy {
  reels: ReelDTO[] = [];
  loading = true;
  error: string | null = null;
  @ViewChildren('videoEl') videoElements!: QueryList<ElementRef<HTMLVideoElement>>;
  private observer?: IntersectionObserver;
  private currentPlayingIndex: number | null = null;
  private subs: Subscription = new Subscription();
  heartVisible: boolean[] = [];

  // 🎵 Audio assets
  private likeSound = new Audio('assets/sounds/like.wav');
  private doubleTapSound = new Audio('assets/sounds/heart-pop.wav');

  constructor(private reelService: ReelService, private renderer: Renderer2, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadReels();
  }

  ngAfterViewInit(): void {
    this.videoElements.changes.subscribe(() => this.setupObserver());
    this.setupObserver();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.observer?.disconnect();
  }

  loadReels(): void {
    this.subs.add(
      this.reelService.getAllReels().subscribe({
        next: (response) => {
          this.reels = response.data || [];
          this.heartVisible = new Array(this.reels.length).fill(false);
          this.loading = false;
          setTimeout(() => this.setupObserver(), 50);
        },
        error: (err) => {
          this.error = err?.message || 'Failed to load reels.';
          this.loading = false;
        }
      })
    );
  }

  private setupObserver(): void {
    if (this.observer) this.observer.disconnect();
    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          const topEntry = visible[0];
          const topVideo = topEntry.target as HTMLVideoElement;
          this.playSingle(topVideo);
        } else {
          this.videoElements.forEach(v => v.nativeElement.pause());
          this.currentPlayingIndex = null;
        }
      },
      { threshold: [0.4, 0.6, 0.75, 0.9] }
    );
    this.videoElements.forEach((vid) => {
      vid.nativeElement.muted = true;
      this.observer!.observe(vid.nativeElement);
    });
  }

  private playSingle(video: HTMLVideoElement) {
    const list = this.videoElements.toArray();
    const idx = list.findIndex(v => v.nativeElement === video);
    if (this.currentPlayingIndex !== null && this.currentPlayingIndex !== idx) {
      const prev = list[this.currentPlayingIndex];
      prev?.nativeElement.pause();
    }
    video.play().catch(() => {});
    this.currentPlayingIndex = idx;
  }

  togglePlayPause(index: number): void {
    const vid = this.videoElements.toArray()[index]?.nativeElement;
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
      this.currentPlayingIndex = index;
    } else {
      vid.pause();
      this.currentPlayingIndex = null;
    }
  }

  likeReel(reel: ReelDTO, index?: number): void {
    this.likeSound.currentTime = 0;
    this.likeSound.play().catch(() => {});
    if (typeof (reel as any).likedByMe === 'undefined' && typeof (reel as any).likedByCurrentUser !== 'undefined') {
      (reel as any).likedByMe = (reel as any).likedByCurrentUser;
    }
    reel.likedByMe = !reel.likedByMe;
    reel.likeCount = Math.max(0, (reel.likeCount || 0) + (reel.likedByMe ? 1 : -1));
    this.reelService.likeReel(reel.id).subscribe({
      error: () => {
        reel.likedByMe = !reel.likedByMe;
        reel.likeCount = Math.max(0, reel.likeCount + (reel.likedByMe ? 1 : -1));
      }
    });
    if (typeof index === 'number') {
      const videoEl = this.videoElements.toArray()[index]?.nativeElement;
      const parent = videoEl?.parentElement;
      const btn = parent?.querySelector('.actions button.like-btn');
      if (btn) {
        this.renderer.addClass(btn, 'pop');
        setTimeout(() => this.renderer.removeClass(btn, 'pop'), 350);
      }
    }
  }

  reshareReel(reel: ReelDTO): void {
    this.reelService.reshareReel(reel.id).subscribe();
  }

  commentReel(reel: ReelDTO): void {
    this.dialog.open(ReelDetailsDialogComponent, {
      width: '500px',
      data: { reelId: reel.id }
    });
  }

  shareReel(reel: ReelDTO): void {
    this.dialog.open(ShareDialogComponent, {
      width: '500px',
      data: { shareType: 'reel', shareId: reel.id }
    });
  }

  onVideoDoubleTap(index: number): void {
    this.doubleTapSound.currentTime = 0;
    this.doubleTapSound.play().catch(() => {});
    this.heartVisible[index] = true;
    setTimeout(() => (this.heartVisible[index] = false), 600);

    const reel = this.reels[index];
    if (!reel.likedByMe) this.likeReel(reel, index);

    const reelContainer = this.videoElements.toArray()[index]?.nativeElement?.closest('.reel-inner');
    if (reelContainer) this.spawnHeartBurst(reelContainer);
  }

  private spawnHeartBurst(container: Element) {
    const count = Math.floor(Math.random() * 3) + 2; // 2–4 hearts
    for (let i = 0; i < count; i++) {
      setTimeout(() => this.spawnFloatingHeart(container), i * 150);
    }
  }

  private spawnFloatingHeart(container: Element) {
    const heart = document.createElement('div');
    heart.classList.add('floating-heart');
    const drift = (Math.random() - 0.5) * 80;
    const rotation = (Math.random() - 0.5) * 60;
    heart.style.setProperty('--drift', `${drift}px`);
    heart.style.setProperty('--rotation', `${rotation}deg`);
    heart.style.left = `${Math.random() * 80 + 10}%`;
    container.querySelector('.floating-hearts')?.appendChild(heart);
    setTimeout(() => heart.remove(), 2000);
  }

  profilePlaceholder(): string {
    return 'https://via.placeholder.com/100';
  }
}
