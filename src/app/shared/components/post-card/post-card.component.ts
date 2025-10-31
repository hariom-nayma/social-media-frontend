import { Component, Input, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostDTO } from '../../../core/models/post.model';
import { PostService } from '../../../core/services/post.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.css']
})
export class PostCardComponent {
  @Input() post!: PostDTO;
  private postService = inject(PostService);

  showLikeAnimation = false;

  onLike(event: Event): void {
    event.stopPropagation();
    this.triggerLikeAnimation();
    this.toggleLike();
  }

  @HostListener('dblclick')
  onDoubleClick(): void {
    if (!this.post.likedByCurrentUser) {
      this.triggerLikeAnimation();
      this.toggleLike();
    }
  }

  private toggleLike() {
    this.postService.toggleLike(this.post.id).subscribe(() => {
      this.post.likedByCurrentUser = !this.post.likedByCurrentUser;
      this.post.likeCount += this.post.likedByCurrentUser ? 1 : -1;
    });
  }

  private triggerLikeAnimation() {
    this.showLikeAnimation = true;
    setTimeout(() => (this.showLikeAnimation = false), 800);
  }

  onComment(event: Event): void {
    event.stopPropagation();
    console.log('Comment clicked:', this.post.id);
  }

  onShare(event: Event): void {
    event.stopPropagation();
    console.log('Share clicked:', this.post.id);
  }

  onSave(event: Event): void {
    event.stopPropagation();
    this.postService.toggleSavePost(this.post.id).subscribe(() => {
      this.post.savedByMe = !this.post.savedByMe;
    });
  }
}
