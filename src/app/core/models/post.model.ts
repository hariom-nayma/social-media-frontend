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
  archived: boolean;
  userId?: string;
  following?: boolean;
    profileImageUrl?: string;
    premiumUser?: boolean;
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
  likedByCurrentUser: boolean;
  firstName: string;
  lastName: string;
  userId: string;
  comments: CommentDTO[];
  following?: boolean;
  archived: boolean;
  user: {
    id: string;
    username: string;
    profileImageUrl?: string;
    premiumUser?: boolean;
  };
}

export interface CreatePostRequest {
  content: string;
  isPublic?: boolean;
  media?: File;
}

