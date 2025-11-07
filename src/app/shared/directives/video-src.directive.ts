import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({ 
  selector: '[appVideoSrc]',
  standalone: true
})
export class VideoSrcDirective implements OnChanges {
  @Input('appVideoSrc') stream?: MediaStream | null;
  constructor(private el: ElementRef<HTMLVideoElement>) {}
  ngOnChanges(changes: SimpleChanges) {
    if (this.stream) this.el.nativeElement.srcObject = this.stream;
  }
}
