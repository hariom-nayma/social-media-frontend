import { Message } from './chat.model';
import { FeedPostResponseDTO } from './post.model';

export interface EnrichedMessage extends Message {
  post?: FeedPostResponseDTO;
}
