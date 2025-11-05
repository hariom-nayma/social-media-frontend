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
import { MatDialog } from '@angular/material/dialog'; // Import MatDialog
import { ReelDetailsDialogComponent } from '../../../shared/components/reel-details-dialog/reel-details-dialog.component'; // Import ReelDetailsDialogComponent

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

  // Query all video elements
  @ViewChildren('videoEl') videoElements!: QueryList<ElementRef<HTMLVideoElement>>;

  // controls & state
  private observer?: IntersectionObserver;
  private currentPlayingIndex: number | null = null;
  private subs: Subscription = new Subscription();

  // For showing heart pop on double-tap; we maintain a small local state array
  heartVisible: boolean[] = [];

  constructor(private reelService: ReelService, private renderer: Renderer2, private dialog: MatDialog) {} // Inject MatDialog

  ngOnInit(): void {
    this.loadReels();
  }

  ngAfterViewInit(): void {
    // watch for changes in the QueryList (e.g. after data loads)
    this.videoElements.changes.subscribe(() => {
      this.setupObserver();
    });

    // initial setup (in case videos are already rendered)
    this.setupObserver();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  loadReels(): void {
    this.subs.add(
      this.reelService.getAllReels().subscribe({
        next: (response) => {
          this.reels = response.data || [];
          this.heartVisible = new Array(this.reels.length).fill(false);
          this.loading = false;
          // small delay: ensure template rendered and QueryList updated
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
    // disconnect old observer
    if (this.observer) {
      this.observer.disconnect();
    }

    // create new observer - play the *most* visible video, pause others
    this.observer = new IntersectionObserver(
      (entries) => {
        // sort entries by intersection ratio descending
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio - a.intersectionRatio));

        // pick the top-most visible element (if any)
        if (visible.length > 0) {
          const topEntry = visible[0];
          const topVideo = topEntry.target as HTMLVideoElement;
          this.playSingle(topVideo);
        } else {
          // none visible: pause all
          this.videoElements.forEach(v => v.nativeElement.pause());
          this.currentPlayingIndex = null;
        }
      },
      { threshold: [0.4, 0.6, 0.75, 0.9] }
    );

    // observe all video elements
    this.videoElements.forEach((vid) => {
      // ensure mute so autoplay works in mobile browsers
      vid.nativeElement.muted = true;
      this.observer!.observe(vid.nativeElement);
    });
  }

  private playSingle(video: HTMLVideoElement) {
    // find index of this video
    const list = this.videoElements.toArray();
    const idx = list.findIndex(v => v.nativeElement === video);

    // pause previously playing
    if (this.currentPlayingIndex !== null && this.currentPlayingIndex !== idx) {
      const prev = list[this.currentPlayingIndex];
      prev?.nativeElement.pause();
    }

    // play selected if not already playing
    video.play().catch(() => {
      // autoplay may be blocked; keep muted (we already set muted) so usually works
    });
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
    // Use unified property name likedByMe on the model (normalise if backend uses different)
    // Defensive checks
    if (typeof (reel as any).likedByMe === 'undefined' && typeof (reel as any).likedByCurrentUser !== 'undefined') {
      (reel as any).likedByMe = (reel as any).likedByCurrentUser;
    }

    reel.likedByMe = !reel.likedByMe;
    reel.likeCount = Math.max(0, (reel.likeCount || 0) + (reel.likedByMe ? 1 : -1));

    // quick visual response; fire backend
    this.reelService.likeReel(reel.id).subscribe({
      error: () => {
        // rollback on error — keep UX consistent
        reel.likedByMe = !reel.likedByMe;
        reel.likeCount = Math.max(0, reel.likeCount + (reel.likedByMe ? 1 : -1));
      }
    });

    // optional small "pop" animation for button: set a temporary CSS class
    if (typeof index === 'number') {
      const videoEl = this.videoElements.toArray()[index]?.nativeElement;
      if (videoEl) {
        const parent = videoEl.parentElement;
        const btn = parent?.querySelector('.actions button.like-btn');
        if (btn) {
          this.renderer.addClass(btn, 'pop');
          setTimeout(() => this.renderer.removeClass(btn, 'pop'), 350);
        }
      }
    }
  }

  reshareReel(reel: ReelDTO): void {
    this.reelService.reshareReel(reel.id).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  commentReel(reel: ReelDTO): void {
    this.dialog.open(ReelDetailsDialogComponent, {
      width: '500px', // Adjust width as needed
      data: { reelId: reel.id }
    });
  }

  shareReel(reel: ReelDTO): void {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this reel!',
        text: reel.caption || '',
        url: reel.mediaVideoUrl
      }).catch(() => {});
    } else {
      // fallback - copy link
      try {
        navigator.clipboard?.writeText(reel.mediaVideoUrl || '');
        alert('Link copied to clipboard');
      } catch {
        // ignore
      }
    }
  }

  onVideoDoubleTap(index: number): void {
    // show heart pop
    this.heartVisible[index] = true;
    setTimeout(() => (this.heartVisible[index] = false), 600);

    // like the reel if not liked
    const reel = this.reels[index];
    if (!reel.likedByMe) {
      this.likeReel(reel, index);
    }
  }

  // helper used by template to provide safe placeholder
  profilePlaceholder(): string {
    return 'https://via.placeholder.com/100';
  }
}
