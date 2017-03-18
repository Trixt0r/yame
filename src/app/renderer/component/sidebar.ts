import { ResizeableComponent } from './utils/resizable';
import { Component, ElementRef, HostListener } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'sidebar',
  templateUrl: 'sidebar.html',
  styleUrls: ['sidebar.css'],
})
export class SidebarComponent extends ResizeableComponent {

  constructor(public ref: ElementRef) {
    super(ref, 'left', 640, window.innerWidth - 300);
  }

  onResize() {
    this.maxVal = window.innerWidth - 300;
    super.onResize();
  }
}
