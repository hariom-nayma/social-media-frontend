import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private apiUrl = `${environment.apiUrl}/ai`;

  constructor(private http: HttpClient) { }

  autoComment(text: string): Observable<{ comment: string }> {
    return this.http.post<{ comment: string }>(`${this.apiUrl}/comment`, { text });
  }

  autoReply(text: string): Observable<{ replies: string[] }> {
    return this.http.post<{ replies: string[] }>(`${this.apiUrl}/reply`, { text });
  }

  autoCaption(text: string): Observable<{ caption: string }> {
    return this.http.post<{ caption: string }>(`${this.apiUrl}/caption`, { text });
  }

  autoBio(text: string): Observable<{ bio: string }> {
    return this.http.post<{ bio: string }>(`${this.apiUrl}/bio`, { text });
  }
}
