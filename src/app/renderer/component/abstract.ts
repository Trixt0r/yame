import { ElementRef } from '@angular/core';

/**
 * Abstract component with common methods and properties.
 * @export
 * @abstract
 * @class AbstractComponent
 */
export abstract class AbstractComponent {

  /**
   * @protected
   * @type {JQuery}
   * @memberOf ResizeableComponent
   */
  protected $myEl: JQuery;

  constructor(protected ref: ElementRef) { }

  /** @inheritdoc */
  ngOnInit() {
    this.$myEl = $(this.ref.nativeElement);
  }

  /**
   * The jquery object of this component.
   * @readonly
   * @type {JQuery}
   */
  get $el(): JQuery {
    return this.$myEl;
  }

  get elementRef(): ElementRef {
    return this.ref;
  }

  /**
   * Shortcut for `this.$el.find(...)`
   * @param {string} selector
   * @returns {JQuery}
   */
  $(selector: string): JQuery {
    return this.$el.find(selector);
  }

}