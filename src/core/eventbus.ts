import _ = require('underscore');
import Backbone = require('backbone');

/**
 * Typescript compatible version of Backbone.Events for extending it.
 */
export class EventBus {

    // To prevent compile errors, declare all Backbone.Events methods.
    on(eventName: string, callback?: Function, context?: any): any { return; };
    off(eventName?: string, callback?: Function, context?: any): any { return; };
    trigger(eventName: string, ...args: any[]): any { return; };
    bind(eventName: string, callback: Function, context?: any): any { return; };
    unbind(eventName?: string, callback?: Function, context?: any): any { return; };

    once(events: string, callback: Function, context?: any): any { return; };
    listenTo(object: any, events: string, callback: Function): any { return; };
    listenToOnce(object: any, events: string, callback: Function): any { return; };
    stopListening(object?: any, events?: string, callback?: Function): any { return; };
}

_.extend(EventBus.prototype, Backbone.Events);
