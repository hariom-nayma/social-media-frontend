import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReelDTO } from '../models/reel.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ReelService {
  private apiUrl = `${environment.apiUrl}/reels`;

  constructor(private http: HttpClient) { }

  createReel(video: File, caption: string): Observable<ApiResponse<ReelDTO>> {
    const formData = new FormData();
    formData.append('video', video);
    formData.append('caption', caption);
    return this.http.post<ApiResponse<ReelDTO>>(`${this.apiUrl}`, formData);
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
    return this.http.post<ApiResponse<ReelDTO>>(`${this.apiUrl}/${reelId}/like`, {});
  }

  unlikeReel(reelId: string): Observable<ApiResponse<ReelDTO>> {
    return this.http.post<ApiResponse<ReelDTO>>(`${this.apiUrl}/${reelId}/unlike`, {});
  }

  reshareReel(reelId: string): Observable<ApiResponse<ReelDTO>> {
    return this.http.post<ApiResponse<ReelDTO>>(`${this.apiUrl}/${reelId}/reshare`, {});
  }
}
