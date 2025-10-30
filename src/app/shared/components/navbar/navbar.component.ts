import { Component } from '@angular/core';
import { CreatePostModalComponent } from '../create-post-modal/create-post-modal.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CreatePostModalComponent, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  showCreatePostModal = false;

  openCreatePostModal() {
    this.showCreatePostModal = true;
  }

  closeCreatePostModal() {
    this.showCreatePostModal = false;
  }
}
