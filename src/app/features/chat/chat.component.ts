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
isDarkMode = false;

toggleTheme(): void {
  this.isDarkMode = !this.isDarkMode;
}

  messages: Message[] = [];
  newMessageContent: string = '';
  currentUser: UserDTO | null = null;
  recipientUser: UserDTO | null = null;
  conversationId: string | null = null;
  isRecipientTyping: boolean = false;
  isRecipientOnline: boolean = false;
  availableEmojis: string[] = ['👍', '❤️', '😂', '😢', '😡', '🔥', '👏', '🎉'];

  // UI state
  isDark = false;
  showInputEmojiPicker = false;

  currentPage: number = 0;
  pageSize: number = 20;
  hasMoreMessages: boolean = true;
  isLoadingMessages: boolean = false;
  private shouldScrollToBottom: boolean = true;

  private subscriptions: Subscription = new Subscription();

  ngOnInit(): void {
    // read theme
    const stored = localStorage.getItem('chatTheme');
    this.isDark = stored === 'dark';

    this.subscriptions.add(combineLatest([
      this.userService.getMyProfile().pipe(filter(response => response.data !== null)),
      this.route.paramMap.pipe(filter(params => params.has('conversationId') || params.has('username')))
    ]).pipe(
      switchMap(([currentUserResponse, params]) => {
        this.currentUser = currentUserResponse.data!;
        this.conversationId = params.get('conversationId');
        const recipientUsername = params.get('username');

        // connect websocket once we have current user
        this.chatService.connect(this.currentUser.id);
        this.subscribeToChatEvents();

        if (this.conversationId) {
          this.loadMessages(0, this.pageSize);
          return this.userService.getUserProfileByConversationId(this.conversationId);
        } else if (recipientUsername) {
          return this.userService.getUserProfileByUsername(recipientUsername);
        }
        return []; // nothing
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

  // toggleTheme(): void {
  //   this.isDark = !this.isDark;
  //   localStorage.setItem('chatTheme', this.isDark ? 'dark' : 'light');
  // }

  private subscribeToChatEvents(): void {
    this.subscriptions.add(this.chatService.messages$.subscribe(msg => {
      // normalize showEmojiPicker/reactions if absent
      (msg as any).showEmojiPicker = false;
      (msg as any).reactions = msg.reactions ?? [];
      this.messages.push(msg);
      this.shouldScrollToBottom = true;
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
          const normalized = response.content.map((m: any) => ({ ...m, showEmojiPicker: false, reactions: m.reactions ?? [] })).reverse();
          if (page === 0) {
            this.messages = normalized;
            this.shouldScrollToBottom = true;
          } else {
            const oldScrollHeight = this.messagesContainer.nativeElement.scrollHeight;
            this.messages = [...normalized, ...this.messages];
            // We need to wait for the view to update before we can adjust the scroll position
            setTimeout(() => {
              const newScrollHeight = this.messagesContainer.nativeElement.scrollHeight;
              this.messagesContainer.nativeElement.scrollTop = newScrollHeight - oldScrollHeight;
            }, 0);
          }
          this.hasMoreMessages = !response.last;
          this.currentPage = page;
          this.isLoadingMessages = false;
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
        timestamp: new Date()
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
}
