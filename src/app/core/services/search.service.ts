import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { UserDocument } from '../models/user-document.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = `${environment.apiUrl}/search`;

  constructor(private http: HttpClient) { }

  searchUsers(query: string): Observable<ApiResponse<UserDocument[]>> {
    return this.http.get<ApiResponse<UserDocument[]>>(`${this.apiUrl}/users`, { params: { q: query } });
  }
}
