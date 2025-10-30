import { CommentDTO } from './comment.model';

export interface PostDTO {
  id: string;
  content: string;
  mediaUrl?: string;
  userId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  likeCount: number;
  commentsCount: number;
  public: boolean;
  likedByCurrentUser?: boolean;
  createdAt?: string;
  updatedAt?: string;
  profileImage?: string;
  
  // comments?: CommentDTO[];
}

export interface FeedPostResponseDTO {
  id: string;
  content: string;
  mediaUrl: string;
  profileImage: string;
  createdAt: string;
  isPublic: boolean;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  likeCount: number;
  commentsCount: number;
  likedByCurrentUser: boolean;
}

export interface CreatePostRequest {
  content: string;
  isPublic?: boolean;
  media?: File;
}

