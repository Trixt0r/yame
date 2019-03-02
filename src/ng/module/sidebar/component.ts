import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  NgZone,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { ResizeableComponent } from '../utils/component/resizable';
import { HierarchyComponent } from './component/hierarchy';
import { PropertiesComponent } from './component/properties';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs/Observable';
import { ISelectionState } from '../toolbar/tools/selection/ngxs/state';

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

  @Select(state => state.selection) selection$: Observable<ISelectionState>;

  protected onResizeBind: EventListenerObject;

  private timer: any;

  constructor(public ref: ElementRef,
              protected store: Store,
              protected zone: NgZone,
              private cdr: ChangeDetectorRef) {
    super(ref, zone);
    this.maxVal = window.innerWidth - 400;
    this.onResizeBind = this.onResize.bind(this);
    this.zone.runOutsideAngular(() => {
      this.selection$.subscribe(data => {
          if (this.timer) clearTimeout(this.timer);
          this.timer = setTimeout(() => {
            this.hierarchy.selected = data.entities;
            this.properties.properties = data.properties;
            this.properties.entities = data.entities;
            this.properties.setVisibility(data.entities.length > 0);
            cdr.detectChanges();
          }, 1000 / 30);
      });
    });
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
