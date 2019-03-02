import { Component, ElementRef, Output, EventEmitter, AfterViewInit, NgZone } from '@angular/core';
import { ResizeableComponent } from 'ng/module/utils/idx';
import { Store } from '@ngxs/store';
import { UpdateEntityProperty } from 'ng/module/pixi/ngxs/actions';
import { Property } from './property/abstract';

/**
 * The properties component is responsible for rendering the assigned property array.
 *
 * It delegates the specific property rendering the propertiesHost directive.
 *
 * @export
 * @class PropertiesComponent
 * @extends {ResizeableComponent}
 * @implements {AfterViewInit}
 */
@Component({
  moduleId: module.id.toString(),
  selector: 'yame-properties',
  templateUrl: 'properties.html',
  styleUrls: ['./properties.scss'],
})
export class PropertiesComponent extends ResizeableComponent implements AfterViewInit {
  /**
   * The amount to substract from the window height on resize events.
   *
   * @static
   * @type {number}
   */
  static readonly HEIGHT_SUB: number = 100;

  /**
   * The update visibility event, when this component changes visibility.
   *
   * @type {EventEmitter<boolean>}
   */
  @Output() updateVisibility: EventEmitter<boolean> = new EventEmitter();

  /**
   * @type {string} The title of this properties component.
   */
  title: string;

  /**
   * @type {Property[]} A list of properties to render.
   */
  properties: Property[];

  /**
   * @protected
   * @type {boolean} The internal visibility state.
   */
  protected visibility: boolean;

  /**
   * @protected
   * @type {EventListenerObject} The resize handler, which is bound to the scope of the component.
   */
  protected onResizeBound: EventListenerObject;

  constructor(public ref: ElementRef, protected store: Store, protected zone: NgZone) {
    super(ref, zone);
    this.title = 'Properties';
    this.properties = [];
    this.maxVal = window.innerHeight - PropertiesComponent.HEIGHT_SUB;
    this.onResizeBound = this.onResize.bind(this);
    this.zone.runOutsideAngular(() => window.addEventListener('resize', this.onResizeBound));
  }

  /**
   * The visibility state.
   *
   * @type {boolean}
   */
  get visible(): boolean {
    return this.visibility;
  }

  /**
   * Updates the visibility state.
   */
  set visible(visible: boolean) {
    if (visible === this.visibility) return;
    this.visibility = visible;
    (<HTMLElement>this.ref.nativeElement).style.display = visible ? 'block' : 'none';
    this.updateVisibility.next(visible);
  }

  /**
   * Updates the max value based on the window height.
   *
   * @override
   */
  onResize(): void {
    this.maxVal = window.innerHeight - PropertiesComponent.HEIGHT_SUB;
    super.onResize();
  }

  /**
   * Dispatches a property update action.
   *
   * @param {Property} property
   */
  dispatch(property: Property): void {
    this.store.dispatch(new UpdateEntityProperty('select', { [property.name]: property.value }));
  }

  /**
   * Sets the visibility to false.
   *
   * @override
   */
  ngAfterViewInit(): void {
    this.visible = false;
  }
}
