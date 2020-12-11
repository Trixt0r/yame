import { EventEmitter as eventemitter3 } from 'eventemitter3';

/**
 * Event emitter with some more useful methods.
 */
export class EventEmitter extends eventemitter3 {

  /**
   * Helper for triggering the given event for the given property.
   * The event is named `name:property`. `old` and `value` get passed as arguments.
   * Triggering happens only if the provided values are different (`!=`).
   * Also the event `name` gets triggered without any arguments before
   * `name:property`.
   *
   * @param name The name of the event
   * @param property Name of the property which changes.
   * @param old The old value of the property.
   * @param value The new value of the property.
   * @param [fn] Function to be called before the events get emitted.
   * @returns `true` if the event has been triggered.
   */
  protected triggerOnChange(name: string, property: string, old: any, value: any, fn?: Function): boolean {
    if (old != value) {
      if (fn) fn.call(this);
      this.emit(name);
      this.emit(`${name}:${property}`, old, value);
      return true;
    }
    else return false;
  }

  /**
   * Shorthand method for `triggerOnChange`.
   *
   * @param property
   * @param currentValue
   * @param newValue
   * @returns
   */
  protected change(property: string, currentValue: any, newValue: any, fn?: Function): boolean {
    return this.triggerOnChange('change', property, currentValue, newValue, fn);
  }

  /**
   * Delegates the given event on the given event bus to this event bus.
   * This means any event occurring in the given event bus will also be
   * triggered in the current one.
   *
   * @param event The event name on the given event bus
   * @param obj The event bus to listen to
   * @param [alias=event] Optional event name triggered on this
   * @chainable
   */
  // delegateOn<T extends eventemitter3>(event: string, obj: T, alias: string = event): this {
  //   const self = this;
  //   obj.on(event, function() {
  //     const args = [alias].concat(Array.prototype.slice.call(arguments)) as [event: string | symbol, ...args: any[]];
  //     self.emit.apply(self, args);
  //   });
  //   return this;
  // }

}

export default EventEmitter;
