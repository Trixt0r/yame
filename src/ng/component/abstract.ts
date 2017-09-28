import { ElementRef } from '@angular/core';

/**
 * Abstract component with common methods and properties.
 * @export
 * @abstract
 * @class AbstractComponent
 */
export abstract class AbstractComponent {

  constructor(protected ref: ElementRef) { }

  get elementRef(): ElementRef {
    return this.ref;
  }

}
