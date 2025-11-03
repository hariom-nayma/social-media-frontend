import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService } from '../../../core/services/post.service';
import { FeedPostResponseDTO } from '../../../core/models/post.model';
import { MatDialog } from '@angular/material/dialog';
import { PostDetailsDialogComponent } from '../../../shared/components/post-details-dialog/post-details-dialog.component';

@Component({
  selector: 'app-archived-posts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archived-posts.component.html',
  styleUrls: ['./archived-posts.component.css']
})
export class ArchivedPostsComponent implements OnInit {
  private postService = inject(PostService);
  private dialog = inject(MatDialog);

  archivedPosts: FeedPostResponseDTO[] = [];

  ngOnInit(): void {
    this.loadArchivedPosts();
  }

  loadArchivedPosts(): void {
    this.postService.getArchivedPosts().subscribe(response => {
      if (response.data) {
        this.archivedPosts = response.data;
      }
    });
  }

  openPostDetails(postId: string): void {
    this.dialog.open(PostDetailsDialogComponent, {
      data: { postId },
      width: '900px',
      height: '600px'
    });
  }
}
