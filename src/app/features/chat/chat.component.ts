import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewChecked, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, combineLatest, of, Observable, forkJoin } from 'rxjs';
import { filter, switchMap, tap, map, catchError } from 'rxjs/operators';
import { ChatService } from '../../core/services/chat.service';
import { UserService } from '../../core/services/user.service';
import { ChatMessageDto, Message, TypingDTO } from '../../core/models/chat.model';
import { UserDTO } from '../../core/models/user.model';
import { MessageType } from '../../core/models/enums.model';
import { EnrichedMessage } from '../../core/models/enriched-message.model'; 
import { MatDialog } from '@angular/material/dialog';
import { PostDetailsDialogComponent } from '../../shared/components/post-details-dialog/post-details-dialog.component';
import { ReelService } from '../../core/services/reel.service';
import { ReelDTO } from '../../core/models/reel.model';
import { ReelDetailsDialogComponent } from '../../shared/components/reel-details-dialog/reel-details-dialog.component';
import { CallService } from '../../core/services/call.service';
import { CallComponent } from '../call/call.component';
import { PostService } from '../../core/services/post.service';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  @Input() conversationId: string | null = null;
  @Input() recipientUsername: string | null = null;

  private chatService = inject(ChatService);
  private userService = inject(UserService);
  private postService = inject(PostService);
  private reelService = inject(ReelService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private callService = inject(CallService);
  private route = inject(ActivatedRoute);
isDarkMode = false;

toggleTheme(): void {
  this.isDarkMode = !this.isDarkMode;
}

  messages: EnrichedMessage[] = [];
  newMessageContent = '';
  currentUser: UserDTO | null = null;
  recipientUser: UserDTO | null = null;
  isRecipientTyping = false;
  isRecipientOnline = false;
  isBlockedByViewer = false; 
  availableEmojis: string[] = ['👍', '❤️', '😂', '😢', '😡', '🔥', '👏', '🎉'];
  MessageType = MessageType;

  // UI state
  isDark = false;
  showInputEmojiPicker = false;

  currentPage = 0;
  pageSize = 20;
  hasMoreMessages = true;
  isLoadingMessages = false;
  private shouldScrollToBottom = true;

  private subscriptions: Subscription = new Subscription();

  ngOnInit(): void {
    // read theme
    const stored = localStorage.getItem('chatTheme');
    this.isDark = stored === 'dark';

    this.subscriptions.add(combineLatest([
      this.userService.getMyProfile().pipe(filter(response => response.data !== null)),
      this.route.paramMap // Use paramMap directly for reactive updates
    ]).pipe(
      switchMap(([currentUserResponse, params]) => {
        this.currentUser = currentUserResponse.data!;

        // Prioritize @Input values, then fall back to route params
        const currentConversationId = this.conversationId || params.get('conversationId');
        const currentRecipientUsername = this.recipientUsername || params.get('username');

        // connect websocket once we have current user
        this.chatService.connect(this.currentUser.id);
        this.subscribeToChatEvents();

        if (currentConversationId) {
          this.conversationId = currentConversationId;
          this.loadMessages(0, this.pageSize);
          return this.userService.getUserProfileByConversationId(this.conversationId);
        } else if (currentRecipientUsername) {
          this.recipientUsername = currentRecipientUsername;
          return this.userService.getUserProfileByUsername(this.recipientUsername);
        }
        return of(null); // Return an observable of null if no conversationId or recipientUsername
      })
    ).subscribe({
      
     next: response => {
      
      if (response && response.data) {
        this.recipientUser = response.data;
        this.isRecipientOnline = this.recipientUser.isOnline ?? false;
      }
    },
    error: err => {
            if (err.status === 400 && err.error?.message?.includes('blocked by this user')) {
              this.isBlockedByViewer = true;
              this.recipientUser = null; // Clear profile data
            } else {
              console.error('Error fetching user profile:', err);
              // Handle other errors as needed
            }
          }}
  
  ));
    this.subscriptions.add(this.callService.incomingCall$.subscribe(offer => {
      if (offer) {
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
          data: { message: `Incoming call from ${offer.from}. Do you want to accept?` }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.dialog.open(CallComponent, {
              width: '100vw',
              height: '100vh',
              maxWidth: '100vw',
              data: { offer: offer }
            });
          }
        });
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

  // toggleTheme(): void {
  //   this.isDark = !this.isDark;
  //   localStorage.setItem('chatTheme', this.isDark ? 'dark' : 'light');
  // }

  private subscribeToChatEvents(): void {
    this.subscriptions.add(this.chatService.messages$.pipe(
      switchMap(message => this.enrichMessage(message))
    ).subscribe(enrichedMessage => {
      if (!this.conversationId && enrichedMessage.conversationId) {
        this.conversationId = enrichedMessage.conversationId;
      }
      console.log('New message received from WebSocket:', enrichedMessage);
      const optimisticMessageIndex = this.messages.findIndex(m => m.id.startsWith('temp-') && m.content === enrichedMessage.content);

      if (optimisticMessageIndex !== -1) {
        const newMessages = [...this.messages];
        newMessages[optimisticMessageIndex] = { ...enrichedMessage, showEmojiPicker: false, reactions: enrichedMessage.reactions ?? [] };
        this.messages = newMessages;
      } else {
        this.messages = [...this.messages, { ...enrichedMessage, showEmojiPicker: false, reactions: enrichedMessage.reactions ?? [] }];
      }

      this.shouldScrollToBottom = true;
      if (enrichedMessage.senderId !== this.currentUser!.id && !enrichedMessage.seen) {
        this.chatService.markMessageAsSeen(enrichedMessage.id);
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

    this.subscriptions.add(this.chatService.messageReactions$.subscribe(updatedMessage => {
      const messageIndex = this.messages.findIndex(msg => msg.id === updatedMessage.id);
      if (messageIndex !== -1) {
        this.messages[messageIndex].reactions = updatedMessage.reactions;
      }
    }));
  }

  loadMessages(page: number, size: number): void {
    if (this.conversationId && this.hasMoreMessages && !this.isLoadingMessages) {
      this.isLoadingMessages = true;
      this.chatService.getMessages(this.conversationId, page, size).pipe(
        switchMap(response => {
          const messages: Message[] = response.content.map((m: any) => ({ ...m, showEmojiPicker: false, reactions: m.reactions ?? [] })).reverse();
          const enrichedMessages$: Observable<EnrichedMessage>[] = messages.map((m: Message) => this.enrichMessage(m));
          return forkJoin(enrichedMessages$).pipe(
            map((enrichedMessages: EnrichedMessage[]) => ({ enrichedMessages, last: response.last }))
          );
        }),
        tap(({ enrichedMessages, last }) => {
          if (page === 0) {
            this.messages = enrichedMessages;
            this.shouldScrollToBottom = true;
          } else {
            const oldScrollHeight = this.messagesContainer.nativeElement.scrollHeight;
            this.messages = [...enrichedMessages, ...this.messages];
            // We need to wait for the view to update before we can adjust the scroll position
            setTimeout(() => {
              const newScrollHeight = this.messagesContainer.nativeElement.scrollHeight;
              this.messagesContainer.nativeElement.scrollTop = newScrollHeight - oldScrollHeight;
            }, 0);
          }
          this.hasMoreMessages = !last;
          this.currentPage = page;
          this.isLoadingMessages = false;

          // Mark all unread messages as seen
          this.messages.forEach(message => {
            if (message.senderId !== this.currentUser!.id && !message.seen) {
              this.chatService.markMessageAsSeen(message.id);
            }
          });
        })
      ).subscribe();
    }
  }

  sendMessage(): void {
    if (this.newMessageContent.trim() && this.currentUser && this.recipientUser) {
      const chatMessage: ChatMessageDto = {
        conversationId: this.conversationId || '',
        senderId: this.currentUser.id,
        recipientId: this.recipientUser.id,
        content: this.newMessageContent.trim(),
        timestamp: new Date(),
        messageType: MessageType.TEXT
      };
      this.chatService.sendMessage(chatMessage);
      this.newMessageContent = '';
      this.showInputEmojiPicker = false;
      this.sendTypingStatus(false);
      this.shouldScrollToBottom = true;
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
    }
  }

  onTyping(): void {
    this.sendTypingStatus(true);
  }

  onBlur(): void {
    this.sendTypingStatus(false);
  }

  toggleEmojiPicker(message: Message): void {
    // toggle for a particular message; ensure we close input picker
    this.showInputEmojiPicker = false;
    message.showEmojiPicker = !message.showEmojiPicker;
  }

  toggleInputEmojiPicker(): void {
    this.showInputEmojiPicker = !this.showInputEmojiPicker;
    // close all message pickers
    this.messages.forEach(m => (m as any).showEmojiPicker = false);
  }

  reactToMessage(messageId: string, emoji: string): void {
    // use your existing API hook
    this.chatService.sendMessageReaction(messageId, emoji).subscribe(() => {
      const message = this.messages.find(m => m.id === messageId);
      if (message) {
        (message.reactions ||= []).push({ messageId, reaction: emoji, id: '', userId: this.currentUser!.id });
        (message as any).showEmojiPicker = false;
      }
    });
  }

  addEmojiToInput(emoji: string): void {
    this.newMessageContent = (this.newMessageContent || '') + emoji;
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

  onMessageClick(message: EnrichedMessage): void {
    if (message.messageType === MessageType.POST_LINK && message.post) {
      this.dialog.open(PostDetailsDialogComponent, {
        data: { postId: message.post.id },
        width: '80vw',
        maxWidth: '900px'
      });
    } else if (message.messageType === MessageType.REEL_LINK && message.reel) {
      this.dialog.open(ReelDetailsDialogComponent, {
        data: { reelId: message.reel.id },
        width: '80vw',
        maxWidth: '900px'
      });
    } else if (message.messageType === MessageType.PROFILE_LINK && message.user) {
      this.router.navigate(['/profile', message.user.username]);
    }
  }

  startCall(): void {
    if (this.recipientUser) {
      this.dialog.open(CallComponent, {
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        data: { targetUserId: this.recipientUser.id }
      });
    }
  }

  private enrichMessage(message: Message): Observable<EnrichedMessage> {
    if (message.messageType === MessageType.POST_LINK) {
      return this.postService.getPostById(message.content).pipe(
        map(response => ({ ...message, post: response.data })),
        catchError(() => of({ ...message, post: undefined }))
      );
    } else if (message.messageType === MessageType.REEL_LINK) {
      return this.reelService.getReelById(message.content).pipe(
        map(response => ({ ...message, reel: response.data })),
        catchError(() => of({ ...message, reel: undefined }))
      );
    } else if (message.messageType === MessageType.PROFILE_LINK) {
      return this.userService.getUserProfileByUsername(message.content).pipe(
        map(response => ({ ...message, user: response.data })),
        catchError(() => of({ ...message, user: undefined }))
      );
    } else {
      return of(message);
    }
  }
}
