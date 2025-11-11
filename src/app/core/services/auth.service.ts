import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse, RegisterRequest, VerifyOtpRequest, LoginResponse } from '../models/auth.model'; // Added LoginResponse
import { ApiResponse } from '../models/api-response.model';

interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;
  private _isLoggedIn = new BehaviorSubject<boolean>(!!localStorage.getItem('accessToken'));
  public isLoggedIn$ = this._isLoggedIn.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> { // Changed return type to LoginResponse
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.data && !res.data.twoFactorRequired) { // Only set tokens if 2FA is not required
          localStorage.setItem('accessToken', res.data.accessToken!);
          localStorage.setItem('refreshToken', res.data.refreshToken!);
          this._isLoggedIn.next(true);
        }
      })
    );
  }

  oauth2Login(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    this._isLoggedIn.next(true);
  }

  loginWithOtp(credentials: LoginRequest, otp: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login-otp`, credentials, { params: { otp } }).pipe(
      tap(res => {
        if (res.data) {
          localStorage.setItem('accessToken', res.data.accessToken);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          this._isLoggedIn.next(true);
        }
      })
    );
  }

  registerStart(data: RegisterRequest): Observable<ApiResponse<{authToken: string}>> {
    return this.http.post<ApiResponse<{authToken: string}>>(`${this.apiUrl}/register`, data);
  }

  verifyOtpAndCompleteRegistration(data: VerifyOtpRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register/verify`, data).pipe(
      tap(res => {
        if (res.data) {
          localStorage.setItem('accessToken', res.data.accessToken);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          this._isLoggedIn.next(true);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this._isLoggedIn.next(false);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isLoggedIn(): boolean {
    return this._isLoggedIn.value;
  }

  checkUsernameAvailability(username: string): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/check-username`, { params: { username } });
  }
}
