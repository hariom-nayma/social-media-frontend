export interface StoryDTO {
  id: number;
  contentUrl: string;
  caption: string;
  createdAt: Date;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  likedByme: boolean;
  viewedByMe: boolean;
  premiumUser?: boolean;
}