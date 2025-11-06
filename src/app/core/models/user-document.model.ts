export interface UserDocument {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  premiumUser?: boolean;
  hasStory?: boolean;
  verified?: boolean;
}
