import { Component, Input, inject, HostListener, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostDTO } from '../../../core/models/post.model';
import { PostService } from '../../../core/services/post.service';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { UserDTO } from '../../../core/models/user.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PostShareDialogComponent } from '../post-share-dialog/post-share-dialog.component';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, RouterModule, MatDialogModule],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.css']
})
export class PostCardComponent implements OnInit {
  @Input() post!: PostDTO;
  @Output() postDeleted = new EventEmitter<string>();

  private postService = inject(PostService);
  private userService = inject(UserService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  showLikeAnimation = false;
  showOptionsMenu = false;
  currentUser: UserDTO | null = null;

  ngOnInit(): void {
    this.userService.currentUser$.subscribe(user => this.currentUser = user);
  }

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
    const postUrl = `${window.location.origin}/post/${this.post.id}`;
    this.dialog.open(PostShareDialogComponent, {
      width: '500px',
      data: { postId: this.post.id, postUrl: postUrl }
    });
  }

  onSave(event: Event): void {
    event.stopPropagation();
    this.postService.toggleSavePost(this.post.id).subscribe(() => {
      this.post.savedByMe = !this.post.savedByMe;
    });
  }

  deletePost() {
    this.postService.deletePost(this.post.id).subscribe(() => {
      this.postDeleted.emit(this.post.id);
      this.showOptionsMenu = false;
    });
  }

  archivePost() {
    this.postService.archivePost(this.post.id).subscribe(() => {
      this.post.archived = true;
      this.showOptionsMenu = false;
    });
  }

  unarchivePost() {
    this.postService.unarchivePost(this.post.id).subscribe(() => {
      this.post.archived = false;
      this.showOptionsMenu = false;
    });
  }

  viewProfile() {
    this.router.navigate(['/profile', this.post.username]);
    this.showOptionsMenu = false;
  }

  toggleFollow() {
    if (!this.post.userId) return;
    if (this.post.following) {
      this.userService.unfollowUser(this.post.userId).subscribe(() => {
        this.post.following = false;
      });
    } else {
      this.userService.followUser(this.post.userId).subscribe(() => {
        this.post.following = true;
      });
    }
  }

  copyPostUrl() {
    const postUrl = `${window.location.origin}/post/${this.post.id}`;
    navigator.clipboard.writeText(postUrl);
    this.showOptionsMenu = false;
  }
}
