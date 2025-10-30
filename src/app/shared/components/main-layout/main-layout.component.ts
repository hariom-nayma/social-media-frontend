import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BottomNavbarComponent } from '../bottom-navbar/bottom-navbar.component';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, SidebarComponent, BottomNavbarComponent]
})
export class MainLayoutComponent {

}
