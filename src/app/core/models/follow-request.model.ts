import { UserDTO } from './user.model';

export interface FollowRequestDTO {
  id: number;
  follower: UserDTO;
  target: UserDTO;
  accepted: boolean;
}
