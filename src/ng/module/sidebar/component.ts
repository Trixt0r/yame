import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  NgZone,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { ResizeableComponent } from '../utils/component/resizable';
import { HierarchyComponent } from './component/hierarchy';
import { PropertiesComponent } from './component/properties';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs/Observable';
import { ISelectionState } from '../toolbar/tools/selection/ngxs/state';

/**
 * The sidebar component holds components for the hierarchy and properties of the current selection.
 *
 * The sidebar delegates selection state changes to its child components.
 * It also tells the child components to resize properly.
 *
 * @export
 * @class SidebarComponent
 * @extends {ResizeableComponent}
 * @implements {AfterViewInit}
 * @implements {OnDestroy}
 */
@Component({
  moduleId: module.id.toString(),
  selector: 'yame-sidebar',
  templateUrl: 'component.html',
  styleUrls: ['./component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent extends ResizeableComponent implements AfterViewInit, OnDestroy {
  /**
   * The amount to substract from the window width on resize events.
   *
   * @static
   * @type {number}
   */
  static readonly WIDTH_SUB: number = 400;

  /**
   * @type {HierarchyComponent} The hierarchy child component.
   */
  @ViewChild('hierarchy', { static: true }) hierarchy: HierarchyComponent;

  /**
   * @type {PropertiesComponent} The properties child component.
   */
  @ViewChild('properties', { static: true }) properties: PropertiesComponent;

  /**
   * @type {Observable<ISelectionState>} The selection observable.
   */
  @Select(state => state.selection) selection$: Observable<ISelectionState>;

  /**
   * @protected
   * @type {EventListenerObject} The resize handler, which is bound to the scope of the component.
   */
  protected onResizeBound: EventListenerObject;

  /**
   * Internal timer for applying changes on successive state changes.
   *
   * @private
   * @type {*}
   */
  private timer: any;

  constructor(
    public ref: ElementRef,
    protected store: Store,
    protected zone: NgZone,
    protected cdr: ChangeDetectorRef
  ) {
    super(ref, zone);
    this.maxVal = window.innerWidth - SidebarComponent.WIDTH_SUB;
    this.onResizeBound = this.onResize.bind(this);
    this.zone.runOutsideAngular(() => {
      this.selection$.subscribe(data => {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          this.hierarchy.selected = data.entities;
          this.properties.properties = data.properties;
          this.properties.visible = data.entities.length > 0;
          this.cdr.detectChanges();
        }, 1000 / 30);
      });
    });
  }

  /**
   * Updates the max value based on the window width.
   *
   * @override
   */
  onResize(): void {
    this.maxVal = window.innerWidth - SidebarComponent.WIDTH_SUB;
    super.onResize();
  }

  /**
   * Handles visibility and resize events of the child components.
   * Decides to reset the hierarchy max height if the properties are invisible.
   */
  newSize(): void {
    if (!this.properties || !this.hierarchy) return;
    if (!this.properties.visible) return this.hierarchy.resetMaxHeight();
    const val = this.properties.propertyValue;
    this.hierarchy.updateMaxHeight(val);
  }

  /**
   * Adds the resize listener to the window.
   *
   * @override
   */
  ngAfterViewInit(): void {
    this.properties.updateValue(this.properties.clampValue(window.innerHeight * 0.5));
    this.zone.runOutsideAngular(() => window.addEventListener('resize', this.onResizeBound));
    super.ngAfterViewInit();
  }

  /**
   * Removes the resize listener from the window.
   *
   * @override
   */
  ngOnDestroy(): void {
    this.zone.runOutsideAngular(() => window.removeEventListener('resize', this.onResizeBound));
  }
}
