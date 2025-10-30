import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StoryDTO } from '../models/story.model';
import { ApiResponse } from '../models/api-response.model';
import { UserDTO } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class StoryService {
  private apiUrl = `${environment.apiUrl}/stories`;

  constructor(private http: HttpClient) { }

  createStory(formData: FormData): Observable<ApiResponse<StoryDTO>> {
    return this.http.post<ApiResponse<StoryDTO>>(this.apiUrl, formData);
  }

  getStoriesForFeed(): Observable<ApiResponse<StoryDTO[]>> {
    return this.http.get<ApiResponse<StoryDTO[]>>(`${this.apiUrl}/feed`);
  }

  likeStory(storyId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${storyId}/like`, {});
  }

  getStoryLikes(storyId: number): Observable<ApiResponse<UserDTO[]>> {
    return this.http.get<ApiResponse<UserDTO[]>>(`${this.apiUrl}/${storyId}/likes`);
  }

  getStoryViews(storyId: number): Observable<ApiResponse<UserDTO[]>> {
    return this.http.get<ApiResponse<UserDTO[]>>(`${this.apiUrl}/${storyId}/views`);
  }
  viewStory(storyId: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${storyId}/view`, {});
  }
  getMyStories(): Observable<ApiResponse<StoryDTO[]>> {
    return this.http.get<ApiResponse<StoryDTO[]>>(`${this.apiUrl}/myStories`);
  }
}