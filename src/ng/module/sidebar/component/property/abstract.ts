import { EventEmitter } from '@angular/core';
import { PropertyOptions } from 'ng/module/pixi/scene/property';

export interface Property extends PropertyOptions {
  name: string;
  value: any;
}

export interface InputEvent {
  originalEvent: any;
  value: any;
  property: Property;
}

export abstract class PropertyComponent {
  /**
   * The property, this component should render.
   *
   * @type {Property}
   */
  property: Property;

  /** @type {EventEmitter<InputEvent>} The event triggered if the property has been updated. */
  updateEvent: EventEmitter<InputEvent> = new EventEmitter();

  /**
   * Click handler, which emits the update event.
   *
   * @param {any} value
   */
  update(event: any, value: any) {
    const data: InputEvent = {
      originalEvent: event,
      value,
      property: this.property
    };
    this.property.value = value;
    this.updateEvent.emit(data);
  }
}
