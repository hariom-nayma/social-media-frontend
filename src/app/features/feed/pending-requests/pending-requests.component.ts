import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FollowRequestDTO } from '../../../core/models/follow-request.model';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-pending-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-requests.component.html',
  styleUrls: ['./pending-requests.component.css']
})
export class PendingRequestsComponent {
  @Input() pendingRequests: FollowRequestDTO[] = [];

  constructor(private userService: UserService) {}

  acceptRequest(requestId: number): void {
    this.userService.acceptFollowRequest(requestId).subscribe(() => {
      this.pendingRequests = this.pendingRequests.filter(req => req.id !== requestId);
    });
  }

  declineRequest(requestId: number): void {
    this.userService.declineFollowRequest(requestId).subscribe(() => {
      this.pendingRequests = this.pendingRequests.filter(req => req.id !== requestId);
    });
  }
}
