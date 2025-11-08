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
import { Router } from '@angular/router';
import { UserDTO } from '../../../core/models/user.model';
import { LucideAngularModule } from 'lucide-angular';
import { AiService } from '../../../core/services/ai.service';
import { ToastService } from '../../../core/services/toast.service';


interface CommentDisplayDTO extends CommentDTO {
  isLiked?: boolean;
  showReplies?: boolean;
  isGeneratingReply?: boolean;
  generatedReplies?: string[];
}

@Component({
  selector: 'app-post-details-dialog',
  templateUrl: './post-details-dialog.component.html',
  styleUrls: ['./post-details-dialog.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
})
export class PostDetailsDialogComponent implements OnInit {
  @Input() postId!: string;
  @Input() post1!: PostDTO;
  @Output() close = new EventEmitter<void>();

  private postService = inject(PostService);
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private aiService = inject(AiService);
  private toastService = inject(ToastService);

  post: FeedPostResponseDTO | null = null;
  comments: CommentDisplayDTO[] = [];
  commentForm = this.fb.group({
    text: ['', Validators.required],
  });
  replyToCommentId: string | null = null;
  replyingToUsername: string | null = null;
  showOptionsMenu = false;
  currentUser: UserDTO | null = null;
  isGeneratingComment = false;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: { postId: string },
    @Optional() private dialogRef: MatDialogRef<PostDetailsDialogComponent>,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.dialogData) {
      this.postId = this.dialogData.postId;
    }
    this.loadPostDetails();
    this.loadComments();
    this.userService.currentUser$.subscribe(user => this.currentUser = user);
  }

  generateAutoComment() {
    if (!this.post?.content) {
      this.toastService.show('No post content available to generate comment.', 'error');
      return;
    }

    this.isGeneratingComment = true;
    this.aiService.autoComment(this.post.content).subscribe({
      next: (response) => {
        this.commentForm.controls['text'].setValue(response.comment);
        this.isGeneratingComment = false;
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Failed to generate comment.', 'error');
        this.isGeneratingComment = false;
      }
    });
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

  generateAutoReply(comment: CommentDisplayDTO) {
    if (!comment.text) {
      this.toastService.show('No comment text available to generate replies.', 'error');
      return;
    }

    comment.isGeneratingReply = true;
    this.aiService.autoReply(comment.text).subscribe({
      next: (response) => {
        comment.generatedReplies = response.replies;
        comment.isGeneratingReply = false;
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Failed to generate replies.', 'error');
        comment.isGeneratingReply = false;
      }
    });
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

  deletePost() {
    if (!this.post) return;
    this.postService.deletePost(this.post.id).subscribe(() => {
      this.closeDialog();
    });
  }

  archivePost() {
    if (!this.post) return;
    this.postService.archivePost(this.post.id).subscribe(() => {
      this.closeDialog();
    });
  }

  viewProfile() {
    if (!this.post) return;
    this.router.navigate(['/profile', this.post.username]);
    this.closeDialog();
  }

  toggleFollow() {
    if (!this.post) return;
    if (this.post.following) {
      this.userService.unfollowUser(this.post.userId).subscribe(() => {
        this.post!.following = false;
      });
    } else {
      this.userService.followUser(this.post.userId).subscribe(() => {
        this.post!.following = true;
      });
    }
  }

  copyPostUrl() {
    const postUrl = `${window.location.origin}/post/${this.post?.id}`;
    navigator.clipboard.writeText(postUrl);
    this.showOptionsMenu = false;
  }

  unarchivePost() {
    if (!this.post) return;
    this.postService.unarchivePost(this.post.id).subscribe(() => {
      this.closeDialog();
    });
  }
}
