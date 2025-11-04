export interface CommentDTO {
  id: string;
  text: string;
  userId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  userProfileImage?: string;
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
