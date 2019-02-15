import { EventEmitter } from '@angular/core';
import { PropertyOptions } from 'ng/module/pixi/scene/property';

export interface Property extends PropertyOptions {
  name: string;
  value: any;
}

export interface InputEvent {
  originalEvent: KeyboardEvent | MouseEvent | FocusEvent;
  property: string;
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
   * Click handler, which delegates the event.
   *
   * @param {KeyboardEvent} event
   */
  update(event: InputEvent) {
    this.updateEvent.emit(event);
  }
}
