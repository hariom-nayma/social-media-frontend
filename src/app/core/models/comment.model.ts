export interface CommentDTO {
  id: string;
  content: string;
  userId: string;
  username: string;
  profileImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  likesCount?: number;
  likedByCurrentUser?: boolean;
  replies?: Set<CommentDTO>;
}

export interface CreateCommentRequest {
  text: string;
  parentCommentId?: string;
}
