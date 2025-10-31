import { CommentDTO } from './comment.model';

export interface PostDTO {
  likedByCurrentUser: boolean;
  id: string;
  username: string;
  profileImage: string;
  mediaUrl: string;
  content: string;
  likeCount: number;
  commentCount: number;
  savedByMe: boolean;
  createdAt: Date;
}

export interface FeedPostResponseDTO {
  id: string;
  username: string;
  profileImage: string;
  mediaUrl: string;
  content: string;
  likeCount: number;
  commentCount: number;
  savedByMe: boolean;
  createdAt: Date;
}

export interface CreatePostRequest {
  content: string;
  isPublic?: boolean;
  media?: File;
}

