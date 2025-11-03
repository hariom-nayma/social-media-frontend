import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, Subject, throwError } from 'rxjs';
import SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';
import { environment } from '../../../environments/environment';
import { ChatMessageDto, Message, TypingDTO, PresenceDTO, ConversationListDTO } from '../models/chat.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private stompClient: Stomp.Client | undefined;
  private messageSubject: Subject<Message> = new Subject<Message>();
  private typingSubject: Subject<TypingDTO> = new Subject<TypingDTO>();
  private presenceSubject: Subject<PresenceDTO> = new Subject<PresenceDTO>();
  private messagesSeenSubject: Subject<Message> = new Subject<Message>();
  private messageReactionsSubject: Subject<Message> = new Subject<Message>();

  public messages$: Observable<Message> = this.messageSubject.asObservable();
  public typingStatus$: Observable<TypingDTO> = this.typingSubject.asObservable();
  public presenceStatus$: Observable<any> = this.presenceSubject.asObservable();
  public messagesSeen$: Observable<Message> = this.messagesSeenSubject.asObservable();
  public messageReactions$: Observable<Message> = this.messageReactionsSubject.asObservable();

  constructor(private http: HttpClient) { }

  connect(userId: string): void {
    const jwtToken = localStorage.getItem('accessToken'); // Assuming token is stored here
    if (!jwtToken) {
      console.error('JWT Token not found. Cannot establish WebSocket connection.');
      return;
    }

    console.log(`Attempting to connect to WebSocket for user: ${userId}`);
    const socket = new SockJS(`http://localhost:8080/ws?token=${jwtToken}`);
    this.stompClient = Stomp.over(socket);

    this.stompClient.connect({}, () => {
      console.log('WebSocket connected successfully.');

      // Subscribe to private messages
      this.stompClient?.subscribe(`/user/${userId}/queue/messages`, (message) => {
        console.log('Received raw message:', message);
        try {
          const parsedMessage = JSON.parse(message.body);
          console.log('Parsed message:', parsedMessage);
          this.messageSubject.next(parsedMessage);
        } catch (error) {
          console.error('Error parsing message body:', error);
        }
      });
      console.log(`Subscribed to message queue: /user/${userId}/queue/messages`);

      // Subscribe to typing status
      this.stompClient?.subscribe(`/user/${userId}/queue/typing`, (typingDto) => {
        console.log('Received typing status:', JSON.parse(typingDto.body));
        this.typingSubject.next(JSON.parse(typingDto.body));
      });
      console.log(`Subscribed to /user/${userId}/queue/typing`);

      // Subscribe to presence updates
      this.stompClient?.subscribe(`/user/${userId}/queue/presence`, (presenceDto) => {
        console.log('Received presence update:', JSON.parse(presenceDto.body));
        this.presenceSubject.next(JSON.parse(presenceDto.body));
      });
      console.log(`Subscribed to /user/${userId}/queue/presence`);

      // Subscribe to messages seen updates
      this.stompClient?.subscribe(`/user/${userId}/queue/messages.seen`, (message) => {
        console.log('Received message seen update:', JSON.parse(message.body));
        this.messagesSeenSubject.next(JSON.parse(message.body));
      });
      console.log(`Subscribed to /user/${userId}/queue/messages.seen`);

      // Subscribe to message reactions updates
      this.stompClient?.subscribe(`/user/${userId}/queue/messages.reactions`, (message) => {
        console.log('Received message reaction update:', JSON.parse(message.body));
        this.messageReactionsSubject.next(JSON.parse(message.body));
      });
      console.log(`Subscribed to /user/${userId}/queue/messages.reactions`);

    }, (error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.disconnect(() => {
        console.log('Disconnected from WebSocket');
      });
    }
  }

  sendMessage(chatMessage: ChatMessageDto): void {
    if (this.stompClient && this.stompClient.connected) {
      console.log('Sending message:', chatMessage);
      this.stompClient.send('/app/chat.send', {}, JSON.stringify(chatMessage));
    } else {
      console.error('STOMP client not connected. Message not sent:', chatMessage);
    }
  }

  deleteMessageForMe(messageId: string): void {
    this.stompClient?.send('/app/chat.delete', {}, messageId);
  }

  sendTypingStatus(dto: TypingDTO): void {
    this.stompClient?.send('/app/chat.typing', {}, JSON.stringify(dto));
  }

  markMessageAsSeen(messageId: string): void {
    this.stompClient?.send('/app/chat.seen', {}, messageId);
  }

  // API call to get messages for a conversation
  getMessages(conversationId: string, page: number, size: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/messages/${conversationId}?page=${page}&size=${size}`).pipe(
      catchError(error => {
        console.error('Error fetching messages:', error);
        // Attempt to parse the error body if it's a parsing error
        if (error.error instanceof SyntaxError) {
          console.error('Backend response text that caused parsing error:', error.text);
        }
        return throwError(() => new Error('Failed to load messages'));
      })
    );
  }

  // API call to send message reaction
  sendMessageReaction(messageId: string, reaction: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/messages/${messageId}/reactions`, { reaction });
  }

  // API call to unsend message (delete for all)
  unsendMessage(messageId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/messages/${messageId}`);
  }

  // API call to get user conversations
  getUserConversations(): Observable<ConversationListDTO[]> {
    return this.http.get<ConversationListDTO[]>(`${environment.apiUrl}/chat/conversations`);
  }


}
