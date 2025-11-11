import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReelDTO } from '../models/reel.model';
import { ApiResponse } from '../models/api-response.model';
import { CommentDTO } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class ReelService {
  private apiUrl = `${environment.apiUrl}/reels`;

  constructor(private http: HttpClient) { }

  saveReel(reelData: { title: string, description: string, videoUrl: string, thumbnailUrl: string, publicId: string, uploadedBy: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/save`, reelData);
  }

  getReelById(reelId: string): Observable<ApiResponse<ReelDTO>> {
    return this.http.get<ApiResponse<ReelDTO>>(`${this.apiUrl}/${reelId}`);
  }

  getAllReels(): Observable<ApiResponse<ReelDTO[]>> {
    return this.http.get<ApiResponse<ReelDTO[]>>(`${this.apiUrl}`);
  }

  deleteReel(reelId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${reelId}`);
  }

  likeReel(reelId: string): Observable<ApiResponse<ReelDTO>> {
    return this.http.post<ApiResponse<ReelDTO>>(`${this.apiUrl}/${reelId}/toggle-like`, {});
  }

  reshareReel(reelId: string): Observable<ApiResponse<ReelDTO>> {
    return this.http.post<ApiResponse<ReelDTO>>(`${this.apiUrl}/${reelId}/reshare`, {});
  }

  getReelsByUser(username: string): Observable<ApiResponse<ReelDTO[]>> {
    return this.http.get<ApiResponse<ReelDTO[]>>(`${this.apiUrl}/user/${username}`);
  }

  addCommentToReel(reelId: string, text: string): Observable<ApiResponse<CommentDTO>> {
    return this.http.post<ApiResponse<CommentDTO>>(`${this.apiUrl}/${reelId}/comments`, { text });
  }

  getCommentsForReel(reelId: string): Observable<ApiResponse<CommentDTO[]>> {
    return this.http.get<ApiResponse<CommentDTO[]>>(`${this.apiUrl}/${reelId}/comments`);
  }

  deleteCommentFromReel(reelId: string, commentId: string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/${reelId}/comments/${commentId}`);
  }
}
