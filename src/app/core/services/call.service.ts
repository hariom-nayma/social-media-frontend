import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

interface SignalMessage {
  type: string;
  from: string;
  to?: string;
  callId?: string;
  payload?: any;
}

@Injectable({ providedIn: 'root' })
export class CallService {
  private socket!: Socket;
  public localStream: MediaStream | null = null;
  public remoteStream$ = new BehaviorSubject<MediaStream | null>(null);
  public incomingCall$ = new BehaviorSubject<SignalMessage | null>(null);
  private pc!: RTCPeerConnection;
  private incomingOffer: any = null;
  public callId: string | null = null;
  private userId!: string;

  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      // You should replace this with your own TURN server credentials
      // { urls: 'turn:yourdomain.com:3478', username: 'turnuser', credential: 'turnpass' }
    ]
  };

  constructor(private ngZone: NgZone) {}

  connect(token: string, userId: string) {
    this.userId = userId;
    this.socket = io('http://localhost:8080', { // Replace with your backend URL
      query: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => console.log('Socket connected', this.socket.id));

    this.socket.on('call:offer', (msg: SignalMessage) => this.ngZone.run(() => this.onOffer(msg)));
    this.socket.on('call:answer', (msg: SignalMessage) => this.ngZone.run(() => this.onAnswer(msg)));
    this.socket.on('call:ice', (msg: SignalMessage) => this.ngZone.run(() => this.onIce(msg)));
    this.socket.on('call:reject', (msg: SignalMessage) => this.ngZone.run(() => this.onReject()));
    this.socket.on('call:leave', (msg: SignalMessage) => this.ngZone.run(() => this.onLeave()));
  }

  setUserId(id: string) {
    this.userId = id;
  }

  async startLocalMedia(audio = true, video = true): Promise<MediaStream> {
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio, video });
    return this.localStream;
  }

  private async createPeerConnection() {
    this.pc = new RTCPeerConnection(this.rtcConfig);
    this.pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        this.emitSignal('call:ice', { candidate: ev.candidate });
      }
    };

    this.pc.ontrack = (ev) => {
      const [stream] = ev.streams;
      this.remoteStream$.next(stream);
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => this.pc.addTrack(track, this.localStream!));
    }
  }

  async callUser(targetUserId: string, audio = true, video = true) {
    this.callId = uuidv4();
    await this.startLocalMedia(audio, video);
    await this.createPeerConnection();

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    this.emitSignal('call:offer', { to: targetUserId, sdp: offer, callId: this.callId, mode: video ? 'video' : 'audio' });
  }

  async acceptCall(fromUserId: string) {
    await this.startLocalMedia(true, true);
    await this.createPeerConnection();
    await this.pc.setRemoteDescription(new RTCSessionDescription(this.incomingOffer));

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    this.emitSignal('call:answer', { to: fromUserId, sdp: answer, callId: this.callId });
  }

  async onOffer(msg: SignalMessage) {
    this.callId = msg.callId!;
    this.incomingOffer = msg.payload.sdp;
    this.incomingCall$.next(msg);
  }

  async onAnswer(msg: SignalMessage) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(msg.payload.sdp));
  }

  async onIce(msg: SignalMessage) {
    if (msg.payload?.candidate) {
      try {
        await this.pc.addIceCandidate(msg.payload.candidate);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  onReject() {
    alert('Call rejected');
    this.hangup();
  }

  onLeave() {
    this.hangup();
  }

  emitSignal(type: string, payload: any) {
    const msg: SignalMessage = {
      type,
      from: this.userId,
      to: payload.to,
      callId: payload.callId || this.callId,
      payload
    };
    this.socket.emit('signal', msg);
  }

  toggleMute() {
    this.localStream?.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
  }

  toggleVideo() {
    this.localStream?.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
  }

  async startScreenShare() {
    const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
    const screenTrack = screenStream.getVideoTracks()[0];
    const sender = this.pc.getSenders().find(s => s.track?.kind === 'video');
    if (sender) sender.replaceTrack(screenTrack);
    screenTrack.onended = () => {
      const localVideo = this.localStream?.getVideoTracks()[0];
      if (localVideo) sender?.replaceTrack(localVideo);
    };
  }

  hangup() {
    this.pc?.getSenders().forEach(s => s.track?.stop());
    this.pc?.close();
    this.localStream = null;
    this.remoteStream$.next(null);
    if (this.callId) {
      this.emitSignal('call:leave', { callId: this.callId });
      this.callId = null;
    }
  }
}
