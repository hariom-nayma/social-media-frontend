import { MessageDTO } from './message.model';
import { UserDTO } from './user.model';

export interface ChatDTO {
  id: string;
  participants: UserDTO[];
  lastMessage?: MessageDTO;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}
