import { UserDTO } from './user.model';

export interface MessageDTO {
  id: string;
  chatId: string;
  sender: UserDTO;
  content: string;
  mediaUrl?: string;
  type: 'TEXT' | 'IMAGE' | 'EMOJI';
  seen: boolean;
  delivered: boolean;
  createdAt: string;
  isUnsent: boolean;
}

export interface CreateMessageRequest {
  chatId: string;
  content?: string;
  media?: File;
  type: 'TEXT' | 'IMAGE' | 'EMOJI';
}
