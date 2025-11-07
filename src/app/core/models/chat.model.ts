import { MessageType } from './enums.model';
import { UserDTO } from './user.model';

export interface ChatMessageDto {
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: Date;
  messageType: MessageType;
}

export interface TypingDTO {
  senderId: string;
  recipientId: string;
  typing: boolean;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  reaction: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderFirstName: string;
  senderLastName: string;
  senderProfileImageUrl?: string;
  content: string;
  sentAt: Date;
  delivered: boolean;
  seen: boolean;
  seenAt: Date;
  reactions: MessageReaction[];
  showEmojiPicker?: boolean; // Frontend specific property
  messageType: MessageType;
}

export interface PresenceDTO {
  userId: string;
  online: boolean;
}

export interface Conversation {
  id: string;
  participants: UserDTO[];
  messages: Message[];
  lastMessage: Message;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationListDTO {
  conversationId: string;
  otherUserId: string;
  otherUsername: string;
  otherFirstName: string;
  otherLastName: string;
  otherProfileImageUrl: string;
  lastMessageContent: string;
  lastMessageTimestamp: Date;
  unreadMessageCount: number;
}
