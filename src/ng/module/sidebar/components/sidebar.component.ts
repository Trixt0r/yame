import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  NgZone,
  ChangeDetectionStrategy,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { ResizableComponent } from '../../utils/component/resizable';
import { HierarchyComponent } from './hierarchy/hierarchy.component';
import { SelectionComponent } from './selection/selection.component';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { ISelectState } from 'ng/module/scene';
import { Subscription } from 'rxjs';

/**
 * The sidebar component holds components for the hierarchy and properties of the current selection.
 *
 * The sidebar delegates selection state changes to its child components.
 * It also tells the child components to resize properly.
 */
@Component({
  selector: 'yame-sidebar',
  templateUrl: 'sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent extends ResizableComponent implements AfterViewInit, OnDestroy {
  /**
   * The amount to subtract from the window width on resize events.
   */
  static readonly WIDTH_SUB: number = 400;

  /**
   * Returns the default size based on the current window width.
   */
  static get DEFAULT_SIZE(): number {
    return window.innerWidth * 0.75;
  }

  /**
   * @type {HierarchyComponent} The hierarchy child component.
   */
  @ViewChild('hierarchy', { static: true }) hierarchy!: HierarchyComponent;

  /**
   * The selection child component.
   */
  @ViewChild('selection', { static: true }) selection!: SelectionComponent;

  /**
   * The select query.
   */
  @Select((state: { select: ISelectState }) => state.select) selection$!: Observable<ISelectState>;

  /**
   * The selected entities.
   */
  selected: ISelectState = { entities: [], components: [], isolated: null };

  /**
   * The ids of the selected entities.
   */
  selectedEntities: string[] = [];

  /**
   * Determines whether there are any selections or not.
   */
  hasSelections: boolean = false;

  /**
   * The resize handler, which is bound to the scope of the component.
   */
  protected onResizeBound: () => void;

  /**
   * Reference to the selection subscription.
   */
  protected selectionSub!: Subscription;

  constructor(
    public ref: ElementRef,
    protected store: Store,
    protected zone: NgZone,
    protected cdr: ChangeDetectorRef,
  ) {
    super(ref, zone);
    this.maxVal = window.innerWidth - SidebarComponent.WIDTH_SUB;
    this.onResizeBound = this.onResize.bind(this);
  }

  /**
   * Updates the max value based on the window width.
   */
  onResize(): void {
    this.maxVal = window.innerWidth - SidebarComponent.WIDTH_SUB;
    super.onResize();
  }

  /**
   * Handles visibility and resize events of the child components.
   * Decides to reset the hierarchy max height if the properties are invisible.
   */
  onSizeUpdated(): void {
    if (!this.selection || !this.hierarchy) return;
    if (!this.selection.visible) return this.hierarchy.resetMaxHeight();
    const val = this.selection.propertyValue;
    this.hierarchy.updateMaxHeight(val);
  }

  /**
   * Adds the resize listener to the window.
   *
   * @inheritdoc
   */
  ngAfterViewInit(): void {
    this.selectionSub = this.selection$.subscribe(data => {
      this.selected = data;
      this.selectedEntities = this.selected.entities;
      this.hasSelections = this.selectedEntities.length > 0;
      this.cdr.detectChanges();
    });
    this.updateValue(this.clampValue(SidebarComponent.DEFAULT_SIZE));
    this.selection.updateValue(this.selection.clampValue(window.innerHeight * 0.25));
    this.zone.runOutsideAngular(() => window.addEventListener('resize', this.onResizeBound));
    super.ngAfterViewInit();
  }

  /**
   * Removes the resize listener from the window.
   *
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.zone.runOutsideAngular(() => window.removeEventListener('resize', this.onResizeBound));
    this.selectionSub.unsubscribe();
  }
}
