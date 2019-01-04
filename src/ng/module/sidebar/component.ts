import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ResizeableComponent } from '../utils/component/resizable';
import { HierarchyComponent } from './component/hierarchy';
import { PropertiesComponent } from './component/properties';

@Component({
  moduleId: module.id.toString(),
  selector: 'yame-sidebar',
  templateUrl: 'component.html',
  styleUrls: ['./component.scss'],
})
export class SidebarComponent extends ResizeableComponent implements AfterViewInit {

  @ViewChild('hierarchy') hierarchy: HierarchyComponent;
  @ViewChild('properties') properties: PropertiesComponent;

  constructor(public ref: ElementRef) {
    super(ref);
    this.maxVal = window.innerWidth - 400;
  }

  /** @override */
  onResize() {
    this.maxVal = window.innerWidth - 400;
    super.onResize();
  }

  newSize() {
    if (!this.properties.isVisibile)
      return this.hierarchy.resetMaxHeight();
    const val = this.properties.propertyValue;
    this.hierarchy.updateMaxHeight(val);
  }

  ngAfterViewInit() {
    this.properties.updateValue(this.properties.clampValue(window.innerHeight * 0.5));
    super.ngAfterViewInit();
  }
}
