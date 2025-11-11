import { Component, OnInit } from '@angular/core';
import { SocketService } from '../../core/services/soketio.service';
import { StreamVideoService } from '../../core/services/stream-video.service';
import { UserService } from '../../core/services/user.service';


@Component({
  selector: 'app-call-screen',
  templateUrl: './call-screen.component.html',
  styleUrls: ['./call-screen.component.css']
})
export class CallScreenComponent implements OnInit {
  username!: string;
  incomingCall: any = null;

  constructor(
    private socketService: SocketService,
    private streamService: StreamVideoService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.userService.myMiniProfile().subscribe((res) => {
      this.username = res.data!.username;
      this.socketService.register(this.username);

      // Listen for incoming calls
    //   this.socketService.onIncomingCall().subscribe((call) => {
    //     console.log('📞 Incoming call from', call.from);
    //     this.incomingCall = call;
    //   });

    //   // Listen for call accepted
    //   this.socketService.onCallAccepted().subscribe(async (data) => {
    //     console.log('✅ Call accepted by', data.to);
    //     await this.streamService.startCall(data.callId);
    //   });
    // });
  }

  // async startCall(receiver: string) {
  //   const callId = `${this.username}-${receiver}`;
  //   this.socketService.callUser(this.username, receiver, callId);
  //   await this.streamService.init(this.username);
  //   await this.streamService.startCall(callId);
  // }

  // async acceptCall() {
  //   if (this.incomingCall) {
  //     const { from, callId } = this.incomingCall;
  //     await this.streamService.init(this.username);
  //     await this.streamService.joinCall(callId);
  //     this.socketService.acceptCall(from, this.username, callId);
  //     this.incomingCall = null;
  //   }
  // }
);}}