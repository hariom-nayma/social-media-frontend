import { UserDTO } from "./user.model";

export interface ReelUserDTO {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  following?: boolean; // Indicates if the current user is following this reel user
}

export interface ReelDTO {
  id: string;
  reelUser: ReelUserDTO;
  mediaVideoUrl: string;
  caption: string;
  likeCount: number;
  commentCount: number;
  shareCount: number; // Number of times this reel has been reshared
  reshareCount: number; // Number of users who reshared this reel
  createdAt: string; // Using string for LocalDateTime from backend
  updatedAt: string; // Using string for LocalDateTime from backend
  likedByCurrentUser: boolean;
  sharedByCurrentUser: boolean;
}
