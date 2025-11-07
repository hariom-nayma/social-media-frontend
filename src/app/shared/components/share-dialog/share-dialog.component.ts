
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../core/services/user.service';
import { ChatService } from '../../../core/services/chat.service';
import { MessageType } from '../../../core/models/enums.model';
import { UserDTO } from '../../../core/models/user.model';
import { ChatMessageDto } from '../../../core/models/chat.model';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-share-dialog',
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class ShareDialogComponent implements OnInit {
  followers: UserDTO[] = [];
  selectedUsers: string[] = [];
  shareType: 'post' | 'reel' | 'profile';
  shareId: string;

  constructor(
    public dialogRef: MatDialogRef<ShareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { shareType: 'post' | 'reel' | 'profile', shareId: string },
    private userService: UserService,
    private chatService: ChatService
  ) {
    this.shareType = data.shareType;
    this.shareId = data.shareId;
  }

  ngOnInit(): void {
    this.userService.getCurrentUserFollowers().subscribe((response) => {
      this.followers = response.data || [];
    });
  }

  onUserSelectionChange(userId: string, isSelected: boolean): void {
    if (isSelected) {
      this.selectedUsers.push(userId);
    } else {
      this.selectedUsers = this.selectedUsers.filter((id) => id !== userId);
    }
  }

  onShare(): void {
    const messageType = this.getMessageType();
    this.userService.currentUser$.pipe(take(1)).subscribe(currentUser => {
      console.log('currentUser:', currentUser);
      if (currentUser) {
        if (!this.chatService.isConnected) {
          this.chatService.connect(currentUser.id);
          setTimeout(() => {
            this.sendMessages(currentUser.id, messageType);
          }, 1000); // 1 second delay to allow for connection
        } else {
          this.sendMessages(currentUser.id, messageType);
        }
      }
    });
  }

  private sendMessages(senderId: string, messageType: MessageType): void {
    
    this.selectedUsers.forEach((userId) => {
      const message: ChatMessageDto = {
        content: this.shareId,
        messageType: messageType,
        recipientId: userId,
        senderId: senderId,
        conversationId: '', // The backend should handle this
        timestamp: new Date(),
      };
      this.chatService.sendMessage(message);
    });
    this.dialogRef.close();
  }

  private getMessageType(): MessageType {
    switch (this.shareType) {
      case 'post':
        return MessageType.POST_LINK;
      case 'reel':
        return MessageType.REEL_LINK;
      case 'profile':
        return MessageType.PROFILE_LINK;
      default:
        return MessageType.TEXT;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
