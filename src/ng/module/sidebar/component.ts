import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  NgZone,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ResizeableComponent } from '../utils/component/resizable';
import { HierarchyComponent } from './component/hierarchy';
import { PropertiesComponent } from './component/properties';

@Component({
  moduleId: module.id.toString(),
  selector: 'yame-sidebar',
  templateUrl: 'component.html',
  styleUrls: ['./component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent extends ResizeableComponent implements AfterViewInit {
  @ViewChild('hierarchy') hierarchy: HierarchyComponent;
  @ViewChild('properties') properties: PropertiesComponent;

  protected onResizeBind: EventListenerObject;

  constructor(public ref: ElementRef, protected zone: NgZone) {
    super(ref, zone);
    this.maxVal = window.innerWidth - 400;
    this.onResizeBind = this.onResize.bind(this);
  }

  /** @override */
  onResize() {
    this.maxVal = window.innerWidth - 400;
    super.onResize();
  }

  newSize() {
    if (!this.properties.isVisibile) return this.hierarchy.resetMaxHeight();
    const val = this.properties.propertyValue;
    this.hierarchy.updateMaxHeight(val);
  }

  ngAfterViewInit() {
    this.properties.updateValue(this.properties.clampValue(window.innerHeight * 0.5));
    this.zone.runOutsideAngular(() => window.addEventListener('resize', this.onResizeBind));
    super.ngAfterViewInit();
  }
}
