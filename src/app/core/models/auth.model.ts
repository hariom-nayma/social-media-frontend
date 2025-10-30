export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
}

export interface VerifyOtpRequest {
  token: string;
  otp: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ForgetPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  otp: string;
  token: string;
  newPassword: string;
}
