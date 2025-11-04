import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReelService } from '../../../core/services/reel.service';
import { ReelDTO } from '../../../core/models/reel.model';

@Component({
  selector: 'app-reels-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reels-list.component.html',
  styleUrls: ['./reels-list.component.css']
})
export class ReelsListComponent implements OnInit {
  reels: ReelDTO[] = [];
  loading = true;
  error: string | null = null;

  constructor(private reelService: ReelService) { }

  ngOnInit(): void {
    this.loadReels();
  }

  loadReels(): void {
    this.loading = true;
    this.reelService.getAllReels().subscribe({
      next: (response) => {
        if (response.data && Array.isArray(response.data)) {
          this.reels = response.data;
        } else {
          this.reels = []; // Ensure it's an empty array if data is not an array
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load reels.';
        console.error('Error loading reels:', err);
        this.loading = false;
      }
    });
  }

  // Placeholder for future reel interaction methods
  likeReel(reelId: string): void {
    // Implement like functionality
    console.log(`Like reel: ${reelId}`);
  }

  reshareReel(reelId: string): void {
    // Implement reshare functionality
    console.log(`Reshare reel: ${reelId}`);
  }
}
