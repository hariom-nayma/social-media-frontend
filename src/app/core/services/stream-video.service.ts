import { Injectable } from '@angular/core';
import { StreamVideoClient } from '@stream-io/video-client';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class StreamVideoService {
  private client!: StreamVideoClient;

  constructor(private http: HttpClient) {}

  async init(username: string) {
    const res = await this.http
      .get<any>(`http://localhost:8080/api/stream/token/${username}`)
      .toPromise();

    this.client = new StreamVideoClient({ apiKey: res.apiKey });
    await this.client.connectUser({ id: res.userId }, res.token);
    console.log('✅ Connected to Stream as', res.userId);
  }

  async startCall(callId: string) {
    const call = this.client.call('default', callId);
    await call.join({ create: true });
    console.log('🎥 Call started:', callId);
    return call;
  }

  async joinCall(callId: string) {
    const call = this.client.call('default', callId);
    await call.join();
    console.log('📞 Joined call:', callId);
    return call;
  }
}
