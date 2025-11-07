import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AuthService } from './core/services/auth.service';
import { CallService } from './core/services/call.service';
import { UserService } from './core/services/user.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LazyLoadImageModule, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'social-media-frontend';

  constructor(
    private authService: AuthService,
    private callService: CallService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.userService.myMiniProfile().subscribe(response => {
          const user = response.data;
          if (user) {
            const token = this.authService.getAccessToken();
            if (token) {
              this.callService.connect(token, user.id);
            }
          }
        });
      }
    });
  }
}
