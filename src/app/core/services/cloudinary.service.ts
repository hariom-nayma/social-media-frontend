import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CloudinarySignature {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private apiUrl = `${environment.apiUrl}/cloudinary/signature`;

  constructor(private http: HttpClient) { }

  getSignature(): Observable<CloudinarySignature> {
    return this.http.get<CloudinarySignature>(this.apiUrl);
  }

  uploadVideo(file: File, signature: CloudinarySignature): Observable<any> {
    const url = `https://api.cloudinary.com/v1_1/${signature.cloudName}/video/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', String(signature.timestamp));
    formData.append('signature', signature.signature);
    formData.append('folder', 'videos/');
    formData.append('eager', 'sp_auto');

    const req = new HttpRequest('POST', url, formData, {
      reportProgress: true
    });

    return this.http.request(req);
  }

  uploadImage(file: File, signature: CloudinarySignature): Observable<any> {
    const url = `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', String(signature.timestamp));
    formData.append('signature', signature.signature);
    formData.append('folder', 'videos/'); 
    formData.append('eager', 'sp_auto');


    const req = new HttpRequest('POST', url, formData, {
      reportProgress: true
    });

    return this.http.request(req);
  }
}
