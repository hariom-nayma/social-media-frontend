import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserDTO } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';
import { SuggestionUserDTO } from '../models/suggestion.model';
import { FollowRequestDTO } from '../models/follow-request.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  private profileApi = `${environment.apiUrl}/profile`;

  private _currentUser = new BehaviorSubject<UserDTO | null>(null);
  public currentUser$ = this._currentUser.asObservable();

  constructor(private http: HttpClient) {}

  getProfileById(userId: string): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.profileApi}/${userId}`);
  }

  getUserProfileByUsername(username: string): Observable<ApiResponse<UserDTO>> {
    return this.http.get<ApiResponse<UserDTO>>(`${this.profileApi}/username/${username}`);
  }

  getMyProfile(): Observable<ApiResponse<UserDTO>> {
    return this.http.get<ApiResponse<UserDTO>>(`${this.profileApi}`);
  }

  myMiniProfile(): Observable<ApiResponse<UserDTO>> {
    return this.http.get<ApiResponse<UserDTO>>(`${this.apiUrl}/me`).pipe(
      tap(response => {
        if (response.data) {
          this._currentUser.next(response.data);
        }
      })
    );
  }

  updateProfile(data: any): Observable<UserDTO> {
    return this.http.put<UserDTO>(`${this.apiUrl}/me`, data);
  }

  updateProfileImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/me/profile-image`, formData);
  }

  followUser(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/follow`, {});
  }

  sendFollowRequest(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/follow`, {});
  }

  removeFollowRequest(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/follow`,{});
  }

  unfollowUser(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/unfollow`, {});
  }

  getFriendSuggestions(): Observable<ApiResponse<SuggestionUserDTO[]>> {
    return this.http.get<ApiResponse<SuggestionUserDTO[]>>(`${this.apiUrl}/suggestions`);
  }

  getPendingFollowRequests(): Observable<ApiResponse<FollowRequestDTO[]>> {
    return this.http.get<ApiResponse<FollowRequestDTO[]>>(`${this.apiUrl}/follow-requests`);
  }

  acceptFollowRequest(requestId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/follow-requests/${requestId}/accept`, {});
  }

  declineFollowRequest(requestId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/follow-requests/${requestId}/decline`, {});
  }

  getFollowers(username: string): Observable<ApiResponse<UserDTO[]>> {
    return this.http.get<ApiResponse<UserDTO[]>>(`${this.apiUrl}/${username}/followers`);
  }

  getFollowing(username: string): Observable<ApiResponse<UserDTO[]>> {
    return this.http.get<ApiResponse<UserDTO[]>>(`${this.apiUrl}/${username}/following`);
  }

  getOwnFollowers(): Observable<ApiResponse<UserDTO[]>> {
    return this.http.get<ApiResponse<UserDTO[]>>(`${this.apiUrl}/followers`);
  }

  getOwnFollowing(): Observable<ApiResponse<UserDTO[]>> {
    return this.http.get<ApiResponse<UserDTO[]>>(`${this.apiUrl}/following`);
  }
}
