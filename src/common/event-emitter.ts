import { EventEmitter as eventemitter3 } from 'eventemitter3';

/**
 * Event emitter with some more useful methods.
 *
 * @export
 * @class EventEmitter
 * @extends {eventemitter3}
 */
export default class EventEmitter extends eventemitter3 {

  /**
   * Helper for triggering the given event for the given property.
   * The event is named `name:property`. `o` and `n` get passed as arguments.
   * Triggering happens only if the provided values are different (`!=`).
   * Also the event `name` gets triggered without any arguments before
   * `name:property`.
   *
   * @protected
   * @param {string} name The name of the event
   * @param {string} property Name of the property which changes.
   * @param {any} old The old value of the property.
   * @param {any} value The new value of the property
   * @returns {boolean} `true` ifthe event has been triggered.
   */
  protected triggerOnChange(name: string, property: string, old: any, value: any, fn?: Function): boolean {
    if (old != value) {
      if (fn) fn.call(this);
      this.emit(name);
      this.emit(`${name}:${property}`, old, value)
      return true;
    }
    else return false;
  }

  /**
   * Shorthand method for `triggerOnChange`.
   *
   * @protected
   * @param {string} property
   * @param {any} currentValue
   * @param {any} newValue
   * @returns {boolean}
   */
  protected change(property: string, currentValue: any, newValue: any, fn?: Function): boolean {
    return this.triggerOnChange('change', property, currentValue, newValue, fn);
  }

  /**
   * Delegate the given event on the given event bus to this event bus.
   * This means any event occurring in the given event bus will also be
   * triggered in the current one.
   *
   * @param {string} event The event name on the given event bus
   * @param {EventBus} obj The event bus to listen to
   * @param {string} [alias=event]    Optional event name triggered on this
   * @chainable
   */
  delegateOn<T extends eventemitter3>(event: string, obj: T, alias: string = event): this {
    obj.on(event, function() {
      let args = [alias];
      args = args.concat(Array.prototype.slice.call(arguments));
      this.emit.apply(this, args);
    }.bind(this));
    return this;
  }

}
