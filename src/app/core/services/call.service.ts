import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import io from 'socket.io-client'; // v2.x default export

interface SignalMessage {
  type: string;
  from: string;
  to?: string | null;
  callId?: string;
  payload?: any;
}

@Injectable({ providedIn: 'root' })
export class CallService {
  // use a loose type for v2 client compatibility
  private socket!: any;
  public localStream: MediaStream | null = null;
  public remoteStream$ = new BehaviorSubject<MediaStream | null>(null);
  public incomingCall$ = new BehaviorSubject<SignalMessage | null>(null);
  private pc!: RTCPeerConnection;
  private incomingOffer: any = null;
  public callId: string | null = null;
  private userId!: string;
  private remoteUserId: string | null = null;

  // store peer id for the current call (callee or caller)
  // private remoteUserId?: string;

  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
  {
        urls: "stun:stun.relay.metered.ca:80",
      },
      {
        urls: "turn:global.relay.metered.ca:80",
        username: "911c90de7baa9bddfb3d5b21",
        credential: "yhvW+wbiMlt6QDtT",
      },
      {
        urls: "turn:global.relay.metered.ca:80?transport=tcp",
        username: "911c90de7baa9bddfb3d5b21",
        credential: "yhvW+wbiMlt6QDtT",
      },
      {
        urls: "turn:global.relay.metered.ca:443",
        username: "911c90de7baa9bddfb3d5b21",
        credential: "yhvW+wbiMlt6QDtT",
      },
      {
        urls: "turns:global.relay.metered.ca:443?transport=tcp",
        username: "911c90de7baa9bddfb3d5b21",
        credential: "yhvW+wbiMlt6QDtT",
      },    ]
  };

  constructor(private ngZone: NgZone) {}

  connect(token: string, userId: string) {
    this.userId = userId;

    this.socket = io.connect('http://localhost:4545', {
      query: { token }, // netty-socketio reads token from query
      transports: ['websocket'],
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () =>
      this.ngZone.run(() => console.log('✅ Socket connected:', this.socket.id))
    );
    this.socket.on('connect_error', (error: any) =>
      console.error('❌ Socket.io connection error:', error)
    );


    // listen for events forwarded by the server
        this.socket.on('call:offer', (msg: SignalMessage) => {
          console.log('CallService: Raw call:offer received from Socket.IO:', msg);
          this.ngZone.run(() => this.onOffer(msg));
        });
    this.socket.on('call:answer', (msg: SignalMessage) =>
      this.ngZone.run(() => this.onAnswer(msg))
    );
    this.socket.on('call:ice', (msg: SignalMessage) =>
      this.ngZone.run(() => this.onIce(msg))
    );
    this.socket.on('call:reject', (msg: SignalMessage) =>
      this.ngZone.run(() => this.onReject(msg))
    );
    this.socket.on('call:leave', (msg: SignalMessage) =>
      this.ngZone.run(() => this.onLeave(msg))
    );
  }

  async startLocalMedia(audio = true, video = true): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia is not supported in this browser or context. Please ensure you are using HTTPS.');
    }
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio, video });
    return this.localStream;
  }

  private async createPeerConnection() {
    this.pc = new RTCPeerConnection(this.rtcConfig);

    this.pc.onicecandidate = (ev) => {
      if (ev.candidate && this.remoteUserId) {
        this.emitSignal('call:ice', { to: this.remoteUserId, candidate: ev.candidate });
      }
    };

    this.pc.ontrack = (ev) => {
      const [stream] = ev.streams;
      this.remoteStream$.next(stream);
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach(track =>
        this.pc.addTrack(track, this.localStream!)
      );
    }
  }

  async callUser(targetUserId: string, audio = true, video = true) {
    console.log('CallService: Initiating call to', targetUserId);
    this.callId = uuidv4();
    this.remoteUserId = targetUserId;
    await this.startLocalMedia(audio, video);
    await this.createPeerConnection();

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    this.emitSignal('call:offer', { to: targetUserId, sdp: offer, callId: this.callId, mode: video ? 'video' : 'audio' });
    console.log('CallService: Offer emitted for callId', this.callId);
  }

  async acceptCall(fromUserId: string) {
    console.log('CallService: Accepting call from', fromUserId);
    this.remoteUserId = fromUserId;
    await this.startLocalMedia(true, true);
    await this.createPeerConnection();
    await this.pc.setRemoteDescription(new RTCSessionDescription(this.incomingOffer));

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    this.emitSignal('call:answer', { to: fromUserId, sdp: answer, callId: this.callId });
    console.log('CallService: Answer emitted for callId', this.callId);
  }

  async onOffer(msg: SignalMessage) {
    this.callId = msg.callId!;
    this.incomingOffer = msg.payload.sdp;
      this.remoteUserId = msg.from; // store the caller id so we can reply 
    this.incomingCall$.next(msg);
    console.log('CallService: incomingCall$ emitted offer for callId', this.callId);
  }

  async onAnswer(msg: SignalMessage) {
    // ensure pc exists before setting remote
    if (!this.pc) {
      console.warn('onAnswer: peerConnection not initialized yet.');
      return;
    }
    await this.pc.setRemoteDescription(new RTCSessionDescription(msg.payload.sdp));
  }

  async onIce(msg: SignalMessage) {
    if (msg.payload?.candidate && this.pc) {
      try {
        await this.pc.addIceCandidate(msg.payload.candidate);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  onReject(msg?: SignalMessage) {
    // optional: show reject reason from msg.payload?.reason
    alert('Call rejected');
    this.hangup();
  }

  onLeave(msg?: SignalMessage) {
    this.hangup();
  }

  // Safely emit signals: ensure "to" exists (either payload.to or stored remoteUserId)
  emitSignal(type: string, payload: any) {
    const to = payload?.to || this.remoteUserId;
    if (!to) {
      console.warn(`emitSignal: missing 'to' for ${type}. payload=`, payload);
      return;
    }

    const msg: SignalMessage = {
      type,
      from: this.userId,
      to,
      callId: payload.callId || this.callId || undefined,
      payload
    };

    console.debug('[SOCKET] emitSignal', msg);
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
    try {
      this.pc?.getSenders().forEach(s => s.track?.stop());
      this.pc?.close();
    } catch (e) { /* ignore */ }

    this.localStream = null;
    this.remoteStream$.next(null);

    if (this.callId) {
      // include peer id when notifying server
      this.emitSignal('call:leave', { to: this.remoteUserId, callId: this.callId });
      this.callId = null;
    }
    this.remoteUserId = null;
  }
}
