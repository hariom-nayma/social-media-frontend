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
    
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.localVideo.nativeElement.srcObject = stream;
    
    if (this.call) {
      stream.getTracks().forEach(track => {
        const newStream = new MediaStream([track]);
        if (track.kind === 'video') {
            this.call!.publish(newStream, 'video' as any);
        } else if (track.kind === 'audio') {
            this.call!.publish(newStream, 'audio' as any);
        }
      });
    }

    this.call.on('trackPublished', (event: any) => {
      const track = event.track;
      const participant = event.participant as StreamVideoParticipant;
      if (track.kind === 'video' && participant && (participant.sessionId !== this.call?.state.localParticipant?.sessionId)) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(track.mediaStreamTrack);
        this.remoteVideo.nativeElement.srcObject = mediaStream;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.call) {
      this.call.leave();
    }
  }
}
