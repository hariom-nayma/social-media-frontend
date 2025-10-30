import { UserDTO } from './user.model';

export interface FollowRequest {
  id: number;
  sender: UserDTO;
  receiver: UserDTO;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
}

export interface FollowResponse {
  message: string;
}

export interface FollowerListResponse {
  followers: UserDTO[];
}

export interface FollowingListResponse {
  following: UserDTO[];
}
