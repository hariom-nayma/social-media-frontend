import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../../core/services/chat.service';
import { ConversationListDTO } from '../../../core/models/chat.model';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { UserDTO } from '../../../core/models/user.model';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './conversations.component.html',
  styleUrls: ['./conversations.component.css']
})
export class ConversationsComponent implements OnInit {
  private chatService = inject(ChatService);
  private router = inject(Router);
  private userService = inject(UserService);

  conversations: ConversationListDTO[] = [];
  suggestedUsers: UserDTO[] = [];
  followers: UserDTO[] = [];

  ngOnInit(): void {
    this.loadConversations();
    this.loadSuggestionsAndFollowers();
  }

  loadConversations(): void {
    this.chatService.getUserConversations().subscribe(conversations => {
      this.conversations = conversations;
    });
  }

  loadSuggestionsAndFollowers(): void {
    this.userService.getFriendSuggestions().subscribe(response => {
      if (response.data) {
        this.suggestedUsers = response.data.map(s => ({
          id: s.userId,
          username: s.username,
          firstName: s.firstName || '',
          lastName: s.lastName || '',
          profileImageUrl: s.profileUrl || '',
          email: '', // Assuming email is not in SuggestionUserDTO
          userId: s.userId,
          private: s.private,
          isPrivate: s.private,
          verified: false, // Assuming verified is not in SuggestionUserDTO
          roles: [], // Assuming roles are not in SuggestionUserDTO
        }));
      }
    });

    this.userService.getOwnFollowers().subscribe(response => {
      if (response.data) {
        this.followers = response.data;
      }
    });
  }

  openChat(conversationId: string): void {
    this.router.navigate(['/chat', conversationId]);
  }
}