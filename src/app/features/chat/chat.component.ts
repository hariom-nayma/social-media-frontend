import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, combineLatest } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';
import { ChatService } from '../../core/services/chat.service';
import { UserService } from '../../core/services/user.service';
import { ChatMessageDto, Message, TypingDTO } from '../../core/models/chat.model';
import { UserDTO } from '../../core/models/user.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  private chatService = inject(ChatService);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);

  messages: Message[] = [];
  newMessageContent: string = '';
  currentUser: UserDTO | null = null;
  recipientUser: UserDTO | null = null;
  conversationId: string | null = null;
  isRecipientTyping: boolean = false;
  isRecipientOnline: boolean = false;
  availableEmojis: string[] = ['👍', '❤️', '😂', '😢', '😡'];

  currentPage: number = 0;
  pageSize: number = 20;
  hasMoreMessages: boolean = true;
  isLoadingMessages: boolean = false;
  private shouldScrollToBottom: boolean = true;

  private subscriptions: Subscription = new Subscription();

  ngOnInit(): void {
    this.subscriptions.add(combineLatest([
      this.userService.getMyProfile().pipe(filter(response => response.data !== null)),
      this.route.paramMap.pipe(filter(params => params.has('conversationId') || params.has('username')))
    ]).pipe(
      switchMap(([currentUserResponse, params]) => {
        this.currentUser = currentUserResponse.data!;
        this.conversationId = params.get('conversationId');
        const recipientUsername = params.get('username'); // For direct chat initiation

        if (this.conversationId) {
          this.chatService.connect(this.currentUser.id);
          this.subscribeToChatEvents();
          this.loadMessages(0, this.pageSize);
          return this.userService.getUserProfileByConversationId(this.conversationId);
        } else if (recipientUsername) {
          // If no conversationId but username is present, it's a new chat
          this.chatService.connect(this.currentUser.id);
          this.subscribeToChatEvents();
          return this.userService.getUserProfileByUsername(recipientUsername);
        }
        return []; // No conversationId and no recipientUsername
      })
    ).subscribe(response => {
      if (response && response.data) {
        this.recipientUser = response.data;
      }
    }));
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.chatService.disconnect();
  }

  private subscribeToChatEvents(): void {
    this.subscriptions.add(this.chatService.messages$.subscribe(msg => {
      console.log('WebSocket received message:', msg);
      console.log('Message sender ID:', msg.senderId, 'Current user ID:', this.currentUser?.id);
      // If this is the first message and it has a conversationId, store it
      if (!this.conversationId && msg.conversationId) {
        this.conversationId = msg.conversationId;
        this.loadMessages(0, this.pageSize); // Load previous messages once conversationId is established
      }
      this.messages.push(msg);
      this.shouldScrollToBottom = true; // Scroll to bottom on new message
      // Mark message as seen if it's for the current user and visible
      if (msg.senderId !== this.currentUser!.id && !msg.seen) {
        this.chatService.markMessageAsSeen(msg.id);
      }
    }));

    this.subscriptions.add(this.chatService.typingStatus$.subscribe(typingDto => {
      if (typingDto.senderId === this.recipientUser?.id) {
        this.isRecipientTyping = typingDto.typing;
      }
    }));

    this.subscriptions.add(this.chatService.presenceStatus$.subscribe(presenceDto => {
      if (presenceDto.userId === this.recipientUser?.id) {
        this.isRecipientOnline = presenceDto.online;
      }
    }));

    this.subscriptions.add(this.chatService.messagesSeen$.subscribe(seenMessage => {
      const messageIndex = this.messages.findIndex(msg => msg.id === seenMessage.id);
      if (messageIndex !== -1) {
        this.messages[messageIndex].seen = true;
        this.messages[messageIndex].seenAt = seenMessage.seenAt;
      }
    }));
  }

  loadMessages(page: number, size: number): void {
    if (this.conversationId && this.hasMoreMessages && !this.isLoadingMessages) {
      this.isLoadingMessages = true;
      this.chatService.getMessages(this.conversationId, page, size).pipe(
        tap(response => {
          console.log('HTTP loaded messages (response.content):', response.content);
          response.content.forEach((msg: any) => {
            console.log('Loaded message sender ID:', msg.senderId, 'Current user ID:', this.currentUser?.id);
          });
          if (page === 0) {
            this.messages = response.content; // Initial load or refresh
            this.shouldScrollToBottom = true;
          } else {
            this.messages = [...response.content, ...this.messages]; // Prepend older messages
          }
          this.hasMoreMessages = !response.last; // Assuming 'last' property from Spring Page
          this.currentPage = page;
          this.isLoadingMessages = false;
        })
      ).subscribe();
    }
  }

  sendMessage(): void {
    console.log('Attempting to send message...');
    if (this.newMessageContent.trim() && this.currentUser && this.recipientUser) {
      const chatMessage: ChatMessageDto = {
        conversationId: this.conversationId || '', // Send empty string if new conversation
        senderId: this.currentUser.id,
        recipientId: this.recipientUser.id,
        content: this.newMessageContent,
        timestamp: new Date()
      };
      this.chatService.sendMessage(chatMessage);
      this.newMessageContent = '';
      this.sendTypingStatus(false);
      console.log('Message sent (frontend):', chatMessage);
    } else {
      console.warn('Message not sent. Missing content, currentUser, or recipientUser.', {
        content: this.newMessageContent,
        currentUser: this.currentUser,
        recipientUser: this.recipientUser,
        conversationId: this.conversationId
      });
    }
  }

  sendTypingStatus(typing: boolean): void {
    if (this.currentUser && this.recipientUser) {
      const typingDto: TypingDTO = {
        senderId: this.currentUser.id,
        recipientId: this.recipientUser.id,
        typing: typing
      };
      this.chatService.sendTypingStatus(typingDto);
      console.log('Sending typing status:', typingDto);
    }
  }

  onTyping(): void {
    this.sendTypingStatus(true);
  }

  onBlur(): void {
    this.sendTypingStatus(false);
  }

  toggleEmojiPicker(message: Message): void {
    message.showEmojiPicker = !message.showEmojiPicker;
  }

  reactToMessage(messageId: string, emoji: string): void {
    this.chatService.sendMessageReaction(messageId, emoji).subscribe(() => {
      // Update UI or fetch messages again
      const message = this.messages.find(msg => msg.id === messageId);
      if (message) {
        if (!message.reactions) {
          message.reactions = [];
        }
        message.reactions.push({ messageId, reaction: emoji, id: '', userId: this.currentUser!.id }); // Mock ID and userId
        message.showEmojiPicker = false;
      }
    });
  }

  unsendMessage(messageId: string): void {
    this.chatService.unsendMessage(messageId).subscribe(() => {
      this.messages = this.messages.filter(msg => msg.id !== messageId);
    });
  }

  deleteMessageForMe(messageId: string): void {
    this.chatService.deleteMessageForMe(messageId);
    this.messages = this.messages.filter(msg => msg.id !== messageId);
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    // Detect if scrolled to the top
    if (element.scrollTop === 0 && this.hasMoreMessages && !this.isLoadingMessages) {
      this.currentPage++;
      this.loadMessages(this.currentPage, this.pageSize);
    }
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
}
