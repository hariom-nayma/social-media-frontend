import { Component, ElementRef, OnDestroy, OnInit, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallService } from '../../core/services/call.service';
import { VideoSrcDirective } from '../../shared/directives/video-src.directive';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-call',
  standalone: true,
  imports: [CommonModule, VideoSrcDirective],
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.css']
})
export class CallComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo', { static: true }) localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: true }) remoteVideo!: ElementRef<HTMLVideoElement>;

  remoteStream?: MediaStream | null;
  constructor(
    public callService: CallService,
    @Inject(MAT_DIALOG_DATA) public data: { targetUserId?: string, offer?: any }
  ) {}

  ngOnInit() {
    console.log('CallComponent: ngOnInit called');
    this.callService.remoteStream$.subscribe(stream => {
      this.remoteStream = stream;
      if (stream && this.remoteVideo?.nativeElement) {
        this.remoteVideo.nativeElement.srcObject = stream;
      }
    });
    if (this.data.targetUserId) {
      this.startCall(this.data.targetUserId);
    } else if (this.data.offer) {
      this.acceptCall(this.data.offer.from);
    }
  }

  async startCall(userId: string) {
    await this.callService.callUser(userId);
    this.localVideo.nativeElement.srcObject = this.callService.localStream;
  }

  async acceptCall(fromUser: string) {
    await this.callService.acceptCall(fromUser);
    this.localVideo.nativeElement.srcObject = this.callService.localStream;
  }

  toggleMute() {
    this.callService.toggleMute();
  }

  toggleVideo() {
    this.callService.toggleVideo();
  }

  hangup() {
    this.callService.hangup();
  }

  shareScreen() {
    this.callService.startScreenShare();
  }

  ngOnDestroy() {
    console.log('CallComponent: ngOnDestroy called');
    this.callService.hangup();
  }
}
