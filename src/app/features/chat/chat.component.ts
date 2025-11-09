import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewChecked, Input, AfterViewInit } from '@angular/core';
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
import { GenericConfirmationDialogComponent } from '../../shared/components/generic-confirmation-dialog/generic-confirmation-dialog.component';
import { AiService } from '../../core/services/ai.service'; // Import AiService
import { ToastService } from '../../core/services/toast.service'; // Import ToastService

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked, AfterViewInit { // Added AfterViewInit
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
  private aiService = inject(AiService); // Inject AiService
  private toastService = inject(ToastService); // Inject ToastService

  isDarkMode = false;

  messages: EnrichedMessage[] = [];
  newMessageContent = '';
  currentUser: UserDTO | null = null;
  recipientUser: UserDTO | null = null;
  isRecipientTyping = false;
  isRecipientOnline = false;
  isBlockedByViewer = false; 
  premiumUser = false;
  availableEmojis: string[] = ['👍', '❤️', '😂', '😢', '😡', '🔥', '👏', '🎉'];
  MessageType = MessageType;

  // UI state
  isDark = false;
  showInputEmojiPicker = false;
  isGeneratingReply = false; // New property for AI reply loading state
  isAiFeatureEnabled = false;

  currentPage = 0;
  pageSize = 20;
  hasMoreMessages = true;
  isLoadingMessages = false;
  private shouldScrollToBottom = true;

  private subscriptions: Subscription = new Subscription();

  private sendSound = new Audio('assets/sounds/send.mp3');

  // Canvas confetti properties
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private confettis: any[] = [];
  private animationFrameId: number = 0;


  ngOnInit(): void {
    console.log('ChatComponent: ngOnInit started.');
    // read theme
    const stored = localStorage.getItem('chatTheme');
    this.isDark = stored === 'dark';

    this.subscriptions.add(combineLatest([
      this.userService.getMyProfile().pipe(filter(response => response.data !== null)),
      this.route.paramMap // Use paramMap directly for reactive updates
    ]).pipe(
      switchMap(([currentUserResponse, params]) => {
        this.currentUser = currentUserResponse.data!;
        this.premiumUser = currentUserResponse.data?.premiumUser!;

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
  }

  ngAfterViewInit(): void { // Added ngAfterViewInit
    this.canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    window.addEventListener('resize', this.onResize);
    this.animateConfetti();
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
    window.removeEventListener('resize', this.onResize); // Cleanup resize listener
    cancelAnimationFrame(this.animationFrameId); // Cancel animation frame
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('chatTheme', this.isDarkMode ? 'dark' : 'light');
  }

  private onResize = () => { // Added onResize method
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  };

  private animateConfetti = () => { // Added animateConfetti method
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.confettis.forEach((c, i) => {
      c.x += c.dx;
      c.y += c.dy;
      c.dy += 0.2; // gravity
      c.angle += c.rotationSpeed;
      c.alpha -= 0.01;

      this.ctx.save();
      this.ctx.translate(c.x, c.y);
      this.ctx.rotate((c.angle * Math.PI) / 180);
      this.ctx.fillStyle = c.color;
      this.ctx.globalAlpha = c.alpha;
      this.ctx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
      this.ctx.restore();

      if (c.alpha <= 0) this.confettis.splice(i, 1);
    });
    this.animationFrameId = requestAnimationFrame(this.animateConfetti);
  };

  // toggleTheme(): void {
  //   this.isDarkMode = !this.isDarkMode;
  //   localStorage.setItem('chatTheme', this.isDarkMode ? 'dark' : 'light');
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
    if (!this.newMessageContent.trim()) return;

    // 🌊 Trigger send ripple animation
    this.triggerSendRipple();

    // Play send sound
    this.sendSound.currentTime = 0;
    this.sendSound.play().catch(() => {});

    const msg: ChatMessageDto = {
      conversationId: this.conversationId || '',
      senderId: this.currentUser!.id,
      recipientId: this.recipientUser!.id,
      content: this.newMessageContent.trim(),
      timestamp: new Date(),
      messageType: MessageType.TEXT
    };
    this.chatService.sendMessage(msg);

    this.newMessageContent = '';
    this.showInputEmojiPicker = false;
    this.sendTypingStatus(false);
    this.shouldScrollToBottom = true;
  }

  onAiToggleChange(event: any): void {
    const isChecked = event.target.checked;
    if (isChecked) {
      const dialogRef = this.dialog.open(GenericConfirmationDialogComponent, {
        data: {
          title: 'Enable AI Features',
          message: 'Turning on this button means you allow our AI model to process your data including last few messages. Please consider not to enable with chat contains sensitive data.',
          confirmText: 'I Agree',
          cancelText: 'Disagree'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.isAiFeatureEnabled = true;
        } else {
          this.isAiFeatureEnabled = false;
          event.target.checked = false;
        }
      });
    } else {
      this.isAiFeatureEnabled = false;
    }
  }

  generateAiReply(): void {
    if (!this.isAiFeatureEnabled) return;
    if (!this.currentUser || !this.recipientUser) {
      this.toastService.show('Cannot generate AI reply without current user or recipient.', 'error');
      return;
    }

    this.isGeneratingReply = true;
    this.createAiTypingBubble();

    let textToReplyTo = 'say hi first time message in 3 to 4 words';

    const latestSenderMessage = this.messages
      .filter(msg => msg.senderId === this.recipientUser!.id && msg.messageType === MessageType.TEXT)
      .pop(); // Get the last message from the recipient

    if (latestSenderMessage) {
      textToReplyTo = latestSenderMessage.content;
    }

    this.aiService.autoReply(textToReplyTo).subscribe({ // Changed to ai.service.reply
      next: (response) => {
        this.newMessageContent = response.replies.toString(); // Changed to response.replies.toString()
        this.isGeneratingReply = false;
        this.removeAiTypingBubble();
      },
      error: (err) => {
        this.toastService.show(
          err.error?.message || 'Failed to generate AI reply.',
          'error'
        );
        this.isGeneratingReply = false;
        this.removeAiTypingBubble();
      },
    });
  }

  // 🌊 Ripple on send button
  private triggerSendRipple() {
    const btn = document.querySelector('.chat-input button.send-btn') as HTMLElement;
    if (!btn) return;
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  // 🤖 AI Typing Bubble
  private createAiTypingBubble() {
    const aiBubble = document.createElement('div');
    aiBubble.classList.add('ai-typing-bubble');
    aiBubble.innerHTML = `<span></span><span></span><span></span>`;
    const msgContainer = document.querySelector('.messages');
    if (msgContainer) msgContainer.appendChild(aiBubble);
  }

  private removeAiTypingBubble() {
    const bubble = document.querySelector('.ai-typing-bubble');
    if (bubble) bubble.remove();
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
    if (emoji === '🎉' && (!this.currentUser || !this.currentUser.premiumUser)) {
      this.toastService.show('Only premium users can react with the 🎉 emoji.', 'info');
      return;
    }

    this.chatService.sendMessageReaction(messageId, emoji).subscribe(() => {
      const message = this.messages.find(m => m.id === messageId);
      if (message) {
        (message.reactions ||= []).push({ messageId, reaction: emoji, id: '', userId: this.currentUser!.id });
        (message as any).showEmojiPicker = false;

        // ✨ trigger floating emoji explosion
        const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageEl) this.spawnEmojiExplosion(messageEl as HTMLElement, emoji);
      }

      // 💥 play reaction sound
      const popSound = new Audio('assets/sounds/reaction.mp3');
      popSound.volume = 0.4;
      popSound.play().catch(() => {});
    });
  }

  private spawnEmojiExplosion(container: HTMLElement, emoji: string) {
    const emojiCount = Math.floor(Math.random() * 4) + 4; // 4–8 emojis per explosion
    for (let i = 0; i < emojiCount; i++) {
      const e = document.createElement('span');
      e.classList.add('floating-emoji');
      e.textContent = emoji;

      // randomize flight path
      const driftX = (Math.random() - 0.5) * 120; // left/right drift
      const driftY = Math.random() * -180 - 80; // upward height
      const rotate = (Math.random() - 0.5) * 120;
      const duration = 1.5 + Math.random() * 0.5;

      console.log(`Emoji explosion: driftX=${driftX}, driftY=${driftY}, rotate=${rotate}, duration=${duration}`); // Removed for debugging animation issue

      e.style.setProperty('--x', `${driftX}px`);
      e.style.setProperty('--y', `${driftY}px`);
      e.style.setProperty('--r', `${rotate}deg`);
      e.style.setProperty('--d', `${duration}s`);
      e.style.left = `${50 + (Math.random() - 0.5) * 20}%`; // Re-added for animation

      container.appendChild(e);
      setTimeout(() => e.remove(), duration * 1000);
    }
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
        data: { targetUserId: this.recipientUser.username }
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

  onMessageHover(message: EnrichedMessage, event: MouseEvent): void {
    const hasPartyPopperReaction = message.reactions?.some(r => r.reaction === '🎉');
    if (hasPartyPopperReaction) {
      const { x, y, width, height } = (event.currentTarget as HTMLElement).getBoundingClientRect();
      for (let i = 0; i < 40; i++) {
        this.confettis.push({
          x: x + width / 2,
          y: y + height / 2,
          dx: (Math.random() - 0.5) * 6,
          dy: Math.random() * -4 - 2,
          width: 4,
          height: 10,
          angle: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          color: `hsl(${Math.random() * 360}, 80%, 60%)`,
          alpha: 1
        });
      }
    }
  }

  onMessageLeave(): void {
    // Optionally clear confettis immediately or let them fade out
    // For now, let them fade out naturally as per the animateConfetti logic
    // If immediate clear is needed: this.confettis = [];
  }
}
