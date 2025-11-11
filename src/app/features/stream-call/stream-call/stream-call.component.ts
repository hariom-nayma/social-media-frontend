import { Component, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Call, StreamVideoParticipant } from '@stream-io/video-client';
import { CommonModule } from '@angular/common';
import { StreamVideoService } from '../../../core/services/stream-video.service';
import { UserService } from '../../../core/services/user.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { UserDTO } from '../../../core/models/user.model';

@Component({
  selector: 'app-stream-call',
  templateUrl: './stream-call.component.html',
  styleUrls: ['./stream-call.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class StreamCallComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  private call: Call | undefined;
  private callId: string | null;

  constructor(
    private streamService: StreamVideoService,
    private userService: UserService,
    private route: ActivatedRoute
  ) {
    this.callId = this.route.snapshot.paramMap.get('callId');
  }

  ngOnInit(): void {
    this.userService.myMiniProfile().subscribe((response: ApiResponse<UserDTO>) => {
      const user = response.data;
      if (user) {
        this.streamService.init(user.username).then(() => {
          if (this.callId) {
            this.joinCallAndPublish(this.callId);
          }
        });
      }
    });
  }

  async joinCallAndPublish(callId: string) {
    this.call = await this.streamService.startCall(callId);
    
    if (this.call) {
      // Enable camera
      await this.call.camera.enable();
      const videoStream = (this.call.camera as any).stream as MediaStream;
      if (videoStream && videoStream.getTracks().length > 0) {
        this.localVideo.nativeElement.srcObject = videoStream;
        await this.call.publish(videoStream, 'video' as any);
      }
  
      // Enable microphone
      await this.call.microphone.enable();
      const audioStream = (this.call.microphone as any).stream as MediaStream;
      if (audioStream && audioStream.getTracks().length > 0) {
        await this.call.publish(audioStream, 'audio' as any);
      }
    }

    this.call.on('trackPublished', (event: any) => {
      if (event && event.track) {
        const track = event.track;
        const participant = event.participant as StreamVideoParticipant;
        if (track.kind === 'video' && participant && (participant.sessionId !== this.call?.state.localParticipant?.sessionId)) {
          const mediaStream = new MediaStream();
          mediaStream.addTrack(track.mediaStreamTrack);
          this.remoteVideo.nativeElement.srcObject = mediaStream;
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.call) {
      this.call.leave();
    }
  }
}
