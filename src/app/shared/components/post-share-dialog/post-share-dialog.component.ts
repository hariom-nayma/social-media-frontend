import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { UserDTO } from '../../../core/models/user.model';
import { ChatMessageDto } from '../../../core/models/chat.model';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../../core/services/user.service';


@Component({
  selector: 'app-post-share-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatDialogModule],
  templateUrl: './post-share-dialog.component.html',
  styleUrls: ['./post-share-dialog.component.css']
})
export class PostShareDialogComponent implements OnInit {
  followingUsers: UserDTO[] = [];
  selectedUsers: string[] = [];
  shareLink = '';
  currentUserId: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<PostShareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { postId: string, postUrl: string },
    private userService: UserService,
    private chatService: ChatService,
    private toastService: ToastService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserId = user.id;
      }
    });
    this.shareLink = this.data.postUrl || `${window.location.origin}/post/${this.data.postId}`;
    this.userService.getOwnFollowing().subscribe(response => {
      if (response.data) {
        this.followingUsers = response.data;
      }
    });
  }

  toggleUserSelection(userId: string): void {
    const index = this.selectedUsers.indexOf(userId);
    if (index > -1) {
      this.selectedUsers = [...this.selectedUsers.slice(0, index), ...this.selectedUsers.slice(index + 1)];
    } else {
      this.selectedUsers = [...this.selectedUsers, userId];
    }
  }

  sendToSelectedUsers(): void {
    if (this.selectedUsers.length === 0) {
      this.toastService.show('Please select at least one user to share with.', 'error');
      return;
    }

    if (!this.currentUserId) {
      this.toastService.show('User not logged in.', 'error');
      return;
    }

    const messageContent = `Check out this post: ${this.shareLink}`;
    this.selectedUsers.forEach(recipientId => {
      this.chatService.getConversationId(this.currentUserId!, recipientId).subscribe(conversationId => {
        if (conversationId) {
          const chatMessage: ChatMessageDto = {
            conversationId: conversationId,
            senderId: this.currentUserId!,
            recipientId: recipientId,
            content: messageContent,
            timestamp: new Date()
          };
          this.chatService.sendMessage(chatMessage);
          this.toastService.show(`Post shared with ${recipientId}!`, 'success');
        } else {
          this.toastService.show(`Could not find a conversation with user ${recipientId}.`, 'error');
        }
      });
    });
    this.dialogRef.close();
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.shareLink).then(() => {
      this.toastService.show('Link copied to clipboard!', 'success');
    }).catch(() => {
      this.toastService.show('Failed to copy link.', 'error');
    });
  }

  shareToWhatsApp(): void {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(this.shareLink)}`, '_blank');
  }

  shareToTelegram(): void {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(this.shareLink)}`, '_blank');
  }

  shareToTwitter(): void {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(this.shareLink)}&text=${encodeURIComponent('Check out this post!')}`, '_blank');
  }

  shareToFacebook(): void {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.shareLink)}`, '_blank');
  }

  shareToOthers(): void {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this post!',
        url: this.shareLink,
      }).then(() => {
        this.toastService.show('Post shared successfully!', 'success');
      }).catch((error) => {
        this.toastService.show(`Failed to share: ${error.message}`, 'error');
      });
    } else {
      this.toastService.show('Web Share API is not supported in your browser.', 'error');
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}