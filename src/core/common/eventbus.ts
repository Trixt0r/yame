import * as _ from 'underscore';
import * as Backbone from 'backbone';

/**
 * Typescript compatible version of Backbone.Events for extending it.
 */
export class EventBus {

    // To prevent compile errors, declare all Backbone.Events methods.
    on(eventName: string, callback?: Function, context?: any): any { };
    off(eventName?: string, callback?: Function, context?: any): any { };
    trigger(eventName: string, ...args: any[]): any { };
    bind(eventName: string, callback: Function, context?: any): any { };
    unbind(eventName?: string, callback?: Function, context?: any): any { };

    once(events: string, callback: Function, context?: any): any { };
    listenTo(object: any, events: string, callback: Function): any { };
    listenToOnce(object: any, events: string, callback: Function): any { };
    stopListening(object?: any, events?: string, callback?: Function): any { };

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
     * @param {any} o The old value of the property.
     * @param {any} n The new value of the property
     * @returns {boolean} `true` ifthe event has been triggered.
     */
    protected triggerOnChange(name: string, property: string, o, n, fn?: Function): boolean {
        if (o != n) {
            if (fn) fn.call(this);
            this.trigger(name);
            this.trigger(`${name}:${property}`, o, n)
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
    protected change(property: string, currentValue, newValue, fn?: Function): boolean {
        return this.triggerOnChange('change', property, currentValue, newValue, fn);
    }
}

// Mixin the Backbone.Events behaviour
_.extend(EventBus.prototype, Backbone.Events);

export default EventBus;
