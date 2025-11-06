export interface SuggestionUserDTO {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  profileUrl: string | null;
  mutualCount: number;
  followMe: boolean;
  private: boolean;
  requested: boolean;
  premiumUser?: boolean;
}
