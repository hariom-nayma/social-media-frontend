import { Component, OnInit, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ReelService } from '../../../core/services/reel.service';
import { ReelDTO } from '../../../core/models/reel.model';
import { CommentDTO } from '../../../core/models/comment.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../../core/services/user.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reel-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './reel-details-dialog.component.html',
  styleUrls: ['./reel-details-dialog.component.css']
})
export class ReelDetailsDialogComponent implements OnInit {
  reel: ReelDTO | undefined;
  comments: CommentDTO[] = [];
  newCommentText = '';
  currentUserId: string | null = null;

  private reelService = inject(ReelService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private userService = inject(UserService);

  constructor(
    public dialogRef: MatDialogRef<ReelDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { reelId: string }
  ) { }

  ngOnInit(): void {
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserId = user.id;
      }
    });
    this.loadReelDetails();
    this.loadComments();
  }

  loadReelDetails(): void {
    this.reelService.getReelById(this.data.reelId).subscribe({
      next: (response) => {
        console.log('Reel Details API Response:', response);
        if (response.data) {
          this.reel = response.data;
          console.log('Reel loaded:', this.reel);
        }
      },
      error: (err) => {
        console.error('Error loading reel details:', err);
        this.toastService.show('Failed to load reel details.', 'error');
        this.dialogRef.close();
      }
    });
  }

  loadComments(): void {
    this.reelService.getCommentsForReel(this.data.reelId).subscribe({
      next: (response) => {
        console.log('Comments API Response:', response);
        if (response.data && Array.isArray(response.data)) {
          this.comments = response.data;
          console.log('Comments loaded:', this.comments);
        }
      },
      error: (err) => {
        console.error('Error loading comments:', err);
        this.toastService.show('Failed to load comments.', 'error');
      }
    });
  }

  addComment(): void {
    if (!this.newCommentText.trim() || !this.reel) return;

    this.reelService.addCommentToReel(this.reel.id, this.newCommentText).subscribe({
      next: (response) => {
        if (response.data) {
          this.comments.push(response.data);
          this.newCommentText = '';
          if (this.reel) this.reel.commentCount++;
        }
      },
      error: (err) => {
        console.error('Error adding comment:', err);
        this.toastService.show('Failed to add comment.', 'error');
      }
    });
  }

  deleteComment(commentId: string): void {
    if (!this.reel) return;

    this.reelService.deleteCommentFromReel(this.reel.id, commentId).subscribe({
      next: () => {
        this.comments = this.comments.filter(comment => comment.id !== commentId);
        if (this.reel) this.reel.commentCount--;
        this.toastService.show('Comment deleted successfully.', 'success');
      },
      error: (err) => {
        console.error('Error deleting comment:', err);
        this.toastService.show('Failed to delete comment.', 'error');
      }
    });
  }

  likeReel(): void {
    if (!this.reel) return;

    const action = this.reel.likedByMe ? this.reelService.likeReel(this.reel.id) : this.reelService.likeReel(this.reel.id);

    action.subscribe({
      next: (response) => {
        if (response.data) {
          this.reel!.likeCount = response.data.likeCount;
          this.reel!.likedByMe = response.data.likedByMe;
        }
      },
      error: (err) => {
        console.error(`Error ${this.reel!.likedByMe ? 'unliking' : 'liking'} reel:`, err);
        this.toastService.show(`Failed to ${this.reel!.likedByMe ? 'unlike' : 'like'} reel.`, 'error');
      }
    });
  }

  reshareReel(): void {
    if (!this.reel) return;
    // Implement reshare logic here, similar to likeReel
    console.log('Resharing reel:', this.reel.id);
    this.toastService.show('Reshare functionality not yet implemented.', 'info');
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}