import { Message } from './chat.model';
import { FeedPostResponseDTO } from './post.model';
import { ReelDTO } from './reel.model';

export interface EnrichedMessage extends Message {
  post?: FeedPostResponseDTO;
  reel?: ReelDTO;
}
