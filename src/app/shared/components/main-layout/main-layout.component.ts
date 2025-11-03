import { Component, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BottomNavbarComponent } from '../bottom-navbar/bottom-navbar.component';
import { NotificationService } from '../../../core/services/notification.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, SidebarComponent, BottomNavbarComponent]
})
export class MainLayoutComponent implements OnInit {

  constructor(private notificationService: NotificationService, private userService: UserService) {}

  ngOnInit(): void {
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.notificationService.connect(user.id);
      }
    });
    this.userService.myMiniProfile().subscribe();
  }
}
