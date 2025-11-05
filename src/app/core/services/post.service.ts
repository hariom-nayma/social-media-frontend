// src/app/core/services/post.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

import { ApiResponse } from '../models/api-response.model';
import { FeedPostResponseDTO, PostDTO } from '../models/post.model';
import { CommentDTO, CreateCommentRequest } from '../models/comment.model';

@Injectable({ providedIn: 'root' })
export class PostService {
  private base = `${environment.apiUrl}/posts`;
  constructor(private http: HttpClient) {}

  getFeed(): Observable<ApiResponse<PostDTO[]>> { return this.http.get<ApiResponse<PostDTO[]>>(`${this.base}/feed`); }

  createPost(form: FormData) {
    return this.http.post(`${this.base}`, form);
  }

  toggleLike(postId: string) {
    return this.http.post(`${this.base}/${postId}/like`, {});
  }

  getPostById(postId: string): Observable<ApiResponse<FeedPostResponseDTO>> {
    return this.http.get<ApiResponse<FeedPostResponseDTO>>(`${this.base}/${postId}`);
  }

  getCommentsByPost(postId: string, userId: string, page = 0, size = 10): Observable<ApiResponse<CommentDTO[]>> {
    return this.http.get<ApiResponse<CommentDTO[]>>(`${this.base}/${postId}/comments?userId=${userId}&page=${page}&size=${size}`);
  }

  addComment(postId: string, text: string, parentCommentId?: string): Observable<ApiResponse<CommentDTO>> {
    const req: CreateCommentRequest = { text, parentCommentId };
    return this.http.post<ApiResponse<CommentDTO>>(`${this.base}/${postId}/comment`, req);
  }

  toggleCommentLike(commentId: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.base}/comment/${commentId}/like`, {});
  }

  toggleSavePost(postId: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.base}/${postId}/save`, {});
  }

  getSavedPosts(page: number, size: number): Observable<ApiResponse<FeedPostResponseDTO[]>> {
    return this.http.get<ApiResponse<FeedPostResponseDTO[]>>(`${this.base}/saved`, { params: { page: page.toString(), size: size.toString() } });
  }

  deletePost(postId: string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.base}/${postId}`);
  }

  archivePost(postId: string): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.base}/${postId}/archive`, {});
  }

  getArchivedPosts(): Observable<ApiResponse<FeedPostResponseDTO[]>> {
    return this.http.get<ApiResponse<FeedPostResponseDTO[]>>(`${this.base}/archived`);
  }

  unarchivePost(postId: string): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.base}/${postId}/unarchive`, {});
  }
}
