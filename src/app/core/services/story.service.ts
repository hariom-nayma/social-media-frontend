import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StoryDTO } from '../models/story.model';
import { ApiResponse } from '../models/api-response.model';

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
}