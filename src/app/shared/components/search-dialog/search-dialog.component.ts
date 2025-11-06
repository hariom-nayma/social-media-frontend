import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, map } from 'rxjs';
import { SearchService } from '../../../core/services/search.service';
import { UserDocument } from '../../../core/models/user-document.model';
import { RouterModule } from '@angular/router';
import { ApiResponse } from '../../../core/models/api-response.model'; // ✅ make sure you have this

@Component({
  selector: 'app-search-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './search-dialog.component.html',
  styleUrls: ['./search-dialog.component.css']
})
export class SearchDialogComponent implements OnInit {
  searchControl = new FormControl('');
  searchResults: UserDocument[] = [];
  isLoading = false;

  private dialogRef = inject(MatDialogRef<SearchDialogComponent>);
  private searchService = inject(SearchService);

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.trim() === '') {
          // ✅ return an Observable of empty array
          return of<ApiResponse<UserDocument[]>>({ data: [] } as unknown as ApiResponse<UserDocument[]>);
        }

        this.isLoading = true;
        return this.searchService.searchUsers(query).pipe(
          catchError(() => {
            this.isLoading = false;
            // ✅ return consistent type
            return of<ApiResponse<UserDocument[]>>({ data: [] } as unknown as ApiResponse<UserDocument[]>);
          })
        );
      }),
      map(response => response?.data || [])
    ).subscribe(users => {
      this.isLoading = false;
      this.searchResults = users;
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  goToProfile(username: string): void {
    this.dialogRef.close();
  }
}
