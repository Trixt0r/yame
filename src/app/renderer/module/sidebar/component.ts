import { ViewChild } from '@angular/core';
import { Component, ElementRef } from '@angular/core';
import { ResizeableComponent } from "../utils/component/resizable";

@Component({
  moduleId: module.id,
  selector: 'sidebar',
  templateUrl: 'component.html',
  styleUrls: ['component.css'],
})
export class SidebarComponent extends ResizeableComponent {

  constructor(public ref: ElementRef) {
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
