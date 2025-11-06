import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChatComponent } from '../../../features/chat/chat.component';

@Component({
  selector: 'app-chat-dialog',
  standalone: true,
  imports: [ChatComponent],
  templateUrl: './chat-dialog.html',
  styleUrl: './chat-dialog.css'
})
export class ChatDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { conversationId: string | null, recipientUsername: string | null }) {}
}