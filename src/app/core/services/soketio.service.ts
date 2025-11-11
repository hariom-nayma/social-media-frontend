import { Injectable } from '@angular/core';
import * as io from 'socket.io-client'; // ✅ v2.x import style

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: SocketIOClient.Socket;

  constructor() {
    this.socket = io.connect('http://localhost:3001', {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected:', this.socket.id);
    });

    this.socket.on('connect_error', (err: any) => {
      console.error('❌ Connection Error:', err);
    });
  }

  register(username: string) {
    this.socket.emit('register', username);
  }

  callUser(from: string, to: string, callId: string) {
    this.socket.emit('call-user', { from, to, callId });
  }

  onIncomingCall(callback: (data: any) => void) {
    this.socket.on('incoming-call', callback);
  }

  acceptCall(from: string, to: string, callId: string) {
    this.socket.emit('accept-call', { from, to, callId });
  }

  onCallAccepted(callback: (data: any) => void) {
    this.socket.on('call-accepted', callback);
  }
}
