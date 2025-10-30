import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LazyLoadImageModule } from 'ng-lazyload-image';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LazyLoadImageModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'social-media-frontend';
}
