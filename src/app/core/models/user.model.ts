import { UserRole } from "./enums.model";
import { PostDTO } from "./post.model";

export interface UserDTO {
  id: string;
  userId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  bio?: string;
  private: boolean;
  isPrivate: boolean;
  verified: boolean;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  posts?: PostDTO[];
  roles: UserRole[];
  createdAt?: string;
  updatedAt?: string;
  following?: boolean;
  requested?: boolean;
  isOnline?: boolean;
  premiumUser?: boolean;
  blockedByMe?: boolean;
  phoneNumberVerified?: boolean;
  twoFactorEnabled?: boolean;
  phoneNumber?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  profileImageUrl?: string;
  isPrivate?: boolean;
}

export interface RegisterRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface VerifyOtpRequest {
  token: string;
  otp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
