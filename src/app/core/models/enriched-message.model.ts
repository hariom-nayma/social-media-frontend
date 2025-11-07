import { Message } from './chat.model';
import { FeedPostResponseDTO } from './post.model';
import { ReelDTO } from './reel.model';
import { UserDTO } from './user.model';

export interface EnrichedMessage extends Message {
  post?: FeedPostResponseDTO;
  reel?: ReelDTO;
  user?: UserDTO;
}
