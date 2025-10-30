import { Component, Input, inject } from '@angular/core';
import { PostDTO } from '../../../core/models/post.model';
import { PostService } from '../../../core/services/post.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-post-card',
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class PostCardComponent {
  @Input() post!: PostDTO;
  private postService = inject(PostService);

  onLike(event: Event): void {
    event.stopPropagation();
    this.postService.toggleLike(this.post.id).subscribe(() => {
      // Optimistically update UI
      if (this.post.likedByCurrentUser) {
        this.post.likeCount--;
      } else {
        this.post.likeCount++;
      }
      this.post.likedByCurrentUser = !this.post.likedByCurrentUser;
    });
  }

  onComment(event: Event): void {
    event.stopPropagation();
    // Implement comment functionality here, e.g., open comment input
    console.log('Comment button clicked for post:', this.post.id);
  }

  onShare(event: Event): void {
    event.stopPropagation();
    // Implement share functionality here, e.g., copy link, open share dialog
    console.log('Share button clicked for post:', this.post.id);
  }
}
