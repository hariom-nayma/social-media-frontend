import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  OnInit,
  Optional,
  Inject,
} from '@angular/core';
import { PostService } from '../../../core/services/post.service';
import { FeedPostResponseDTO, PostDTO } from '../../../core/models/post.model';
import { CommentDTO } from '../../../core/models/comment.model';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../../core/services/user.service';

interface CommentDisplayDTO extends CommentDTO {
  isLiked?: boolean;
  showReplies?: boolean;
}

@Component({
  selector: 'app-post-details-dialog',
  templateUrl: './post-details-dialog.component.html',
  styleUrls: ['./post-details-dialog.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class PostDetailsDialogComponent implements OnInit {
  @Input() postId!: string;
  @Input() post1!: PostDTO;
  @Output() close = new EventEmitter<void>();

  private postService = inject(PostService);
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  post: FeedPostResponseDTO | null = null;
  comments: CommentDisplayDTO[] = [];
  commentForm = this.fb.group({
    text: ['', Validators.required],
  });
  replyToCommentId: string | null = null;
  replyingToUsername: string | null = null;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: { postId: string },
    @Optional() private dialogRef: MatDialogRef<PostDetailsDialogComponent>
  ) {}

  ngOnInit() {
    if (this.dialogData) {
      this.postId = this.dialogData.postId;
    }
    this.loadPostDetails();
    this.loadComments();
  }

  loadPostDetails() {
    this.postService.getPostById(this.postId).subscribe((response) => {
      this.post = response.data || null;
    });
  }

  loadComments() {
    this.userService.currentUser$.subscribe((user) => {
      const load = (userId: string) => {
        this.postService
          .getCommentsByPost(this.postId, userId)
          .subscribe((response) => {
            this.comments = this.mapCommentsForDisplay(response.data || []);
          });
      };

      if (user?.id) load(user.id);
      else
        this.userService.myMiniProfile().subscribe((res) => {
          if (res.data?.id) load(res.data.id);
        });
    });
  }

  private mapCommentsForDisplay(comments: CommentDTO[]): CommentDisplayDTO[] {
    return comments.map((comment) => ({
      ...comment,
      isLiked: comment.likedByCurrentUser,
      showReplies: false,
      replies: comment.replies
        ? new Set(this.mapCommentsForDisplay(Array.from(comment.replies)))
        : new Set(),
    }));
  }

  addComment() {
    if (this.commentForm.invalid) return;

    const text = this.commentForm.value.text!;
    const parentCommentId = this.replyToCommentId ?? undefined;

    this.postService
      .addComment(this.postId, text, parentCommentId)
      .subscribe((response) => {
        if (response.data) {
          const newComment: CommentDisplayDTO = {
            ...response.data,
            showReplies: false,
          };

          if (parentCommentId)
            this.addReplyToComment(this.comments, parentCommentId, newComment);
          else this.comments.unshift(newComment);

          // Reset reply mode
          this.replyToCommentId = null;
          this.replyingToUsername = null;
          this.commentForm.reset();
        }
      });
  }

  private addReplyToComment(
    comments: CommentDisplayDTO[],
    parentId: string,
    newReply: CommentDisplayDTO
  ): void {
    for (const comment of comments) {
      if (comment.id === parentId) {
        comment.replies ??= new Set();
        comment.replies.add(newReply);
        comment.showReplies = true;
        return;
      }
      if (comment.replies?.size)
        this.addReplyToComment(Array.from(comment.replies), parentId, newReply);
    }
  }

  toggleCommentLike(comment: CommentDisplayDTO) {
    comment.isLiked = !comment.isLiked;
    comment.likesCount = (comment.likesCount || 0) + (comment.isLiked ? 1 : -1);

    this.postService.toggleCommentLike(comment.id).subscribe({
      error: () => {
        // revert on error
        comment.isLiked = !comment.isLiked;
        comment.likesCount =
          (comment.likesCount || 0) + (comment.isLiked ? 1 : -1);
      },
    });
  }

  toggleRepliesVisibility(comment: CommentDisplayDTO) {
    comment.showReplies = !comment.showReplies;
  }

  openReplyForm(comment: CommentDisplayDTO) {
    this.replyToCommentId = comment.id;
    this.replyingToUsername = comment.username;
  }

  cancelReply() {
    this.replyToCommentId = null;
    this.replyingToUsername = null;
  }

  closeDialog() {
    this.dialogRef ? this.dialogRef.close() : this.close.emit();
  }

  likePost() {
    if (!this.post1) return;

    this.post1.likedByCurrentUser = !this.post1.likedByCurrentUser;
    this.post1.likeCount += this.post1.likedByCurrentUser ? 1 : -1;

    this.postService.toggleLike(this.post1.id).subscribe({
      error: (err) => {
        console.error(err);
        // revert if error
        this.post1.likedByCurrentUser = !this.post1.likedByCurrentUser;
        this.post1.likeCount += this.post1.likedByCurrentUser ? 1 : -1;
      },
    });
  }
}
