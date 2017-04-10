import { ViewChild } from '@angular/core';
import { SidebarDirective } from './sidebar/directive';
import { SidebarService } from '../service/sidebar';
import { ResizeableComponent } from './utils/resizable';
import { Component, ElementRef } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'sidebar',
  templateUrl: 'sidebar.html',
  styleUrls: ['sidebar.css'],
  providers: [SidebarService]
})
export class SidebarComponent extends ResizeableComponent {

  @ViewChild(SidebarDirective) sidebarHost: SidebarDirective;

  constructor(public ref: ElementRef, private service: SidebarService) {
    super(ref);
    this.maxVal = window.innerWidth - 400;
  }

  /** @override */
  onResize() {
    this.maxVal = window.innerWidth - 400;
    super.onResize();
  }

  loadComponents() {

  }
}
