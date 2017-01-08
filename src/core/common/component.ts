import { EventBus } from './eventbus';

import * as _ from 'underscore';

/**
 * Abstract implementation of a component which has a type, name and a value.
 * @abstract
 * @class Component
 * @extends {EventBus}
 */
export abstract class Component<T> extends EventBus {

    constructor(protected _name ? : string, protected _value ? : T) {
        super();
    }

    set value(value: T) {
        if (this._value != value) {
            let prev = this._value;
            this._value = value;
            this.trigger('change', value, prev);
        }
    }

    /**
     * @type {*} value The value of this component.
     */
    get value(): T {
        return this._value;
    }

    set name(name: string) {
        if (this._name != name) {
            let prev = this._name;
            this._name = name;
            this.trigger('name', name, prev);
        }
    }

    /**
     * @type {*} name The name of this component.
     */
    get name(): string {
        return this._name;
    }

    /**
     * Serializes this component and returns it.
     * Sub components are serialzed automatically.
     * @param {*} [options={ }]
     * @returns {*} The json represenation of this component
     */
    toJSON(options: any = { }): any {
        let re: any = { };
        if (typeof this._value == 'object' && this._value !== null) {
            _.each(<any>this._value, (val, key) => {
                if (val instanceof Component)
                    re[val._name] = val.toJSON(options);
                else {
                    re[key] = val;
                    this.trigger('toJSON', re, key, val, options);
                }
            });
            return re;
        }
        else
            return this._value;
    }

    /**
     * Parses the given json object and applies it to this and all sub
     * components.
     *
     * @param {*} json
     * @param {*} [options={ }]
     * @chainable
     */
    fromJSON(json: any, options: any = { }): Component<T> {
        if (typeof this._value == 'object' && this._value !== null)
            _.each(json, (val, key) => {
                if (this._value[key] instanceof Component) {
                    this._value[key].fromJSON(val, options);
                }
                else {
                    this._value[key] = val;
                    this.trigger('fromJSON', this._value, key, val, options);
                }
            });
        else
            this.value = json;
        return this;
    }

    /**
     * @readonly
     * @abstract
     * @type {string} type The type of this component.
     */
    abstract get type(): string;

    /**
     * Creates a copy of this component and returns it.
     *
     * @returns {Component<T>} A copy of this component.
     */
    copy(): Component<T> {
        let isNested = this._value && typeof this._value == 'object';
        let copy = new (<any>this.constructor)(this._name, isNested ? { } : this._value);
        // Populate all nested values into the new object
        if (isNested)
            _.each(<any>this._value, (value, key) => {
                if (value instanceof Component)
                    copy.value[key] = value.copy();
                else
                    copy.value[key] = value;
            });
        return copy;
    }
}

export default Component;

/**
 * Internal map of all defined component types.
 */
let definitions: {[type: string]: typeof Component} = {};

/**
 * Defines a component for the given type.
 *
 * @export
 * @param {string} type
 * @returns {Function}
 */
export function define(type: string): Function {
    return function(target: typeof Component) {
        definitions[type] = target;
    }
}

/**
 * @export
 * @param {string} type
 * @returns {boolean} Whether the given component type is defined.
 */
export function isDefined(type: string): boolean {
    return definitions[type] instanceof Component;
}

/**
 * Creates a new component instance for the given type.
 * @export
 * @template T
 * @param {string} type
 * @param {string} name
 * @param {*} value
 * @returns {Component<T>} The created component instance.
 */
export function create<T>(type: string, name: string, value: any): Component<T> {
    return new (<any>definitions[type])(name, value);
}


/**
 * Function for decorating class members as components.
 * Import the function and use `@comonent` before your class member.
 * @export
 * @param {Component<any>} target
 * @param {string} key
 */
export function component(target: Component<any>, key: string): void {
    let o = { };
    // let handlerSet = false;
    o[key] = {
        // Return the value which should be a component
        get: function() {
            if (this.value[key] && this.value[key] instanceof Component) {
                if (!this.value[key].handlerSet) {
                    // Listen for changes on the component
                    this.value[key].on('change', (val, old) => {
                        this.trigger('change:*', key, val, old);
                        this.trigger('change:?', `change:${key}`, val, old);
                        this.trigger(`change:${key}`, val, old);
                    });

                    // Allow cascaded event handlers, e.g. transformation.position.y
                    let setUpChain = function(event, comp, k) {
                        if (comp instanceof Component) {
                            comp.off('change:*', null, this);
                            comp.off('change', null, this);
                            if (comp.value && typeof comp.value == 'object') {
                                comp.on('change:*', (kk, val, old) => {
                                    this.trigger('change:?', `${event}${k}.${kk}`, val, old);
                                    this.trigger(`${event}${k}.${kk}`, val, old);
                                }, this);
                            }
                            // Delegate on change
                            comp.on('change', (val, old) => {
                                this.trigger('change:?', `${event}${k}`, val, old);
                                this.trigger(`${event}${k}`, val, old);
                            }, this);
                            // Extend the chain if there are still components to listen for
                            if ( comp.value && typeof comp.value == 'object'
                                    && comp.value[k] instanceof Component )
                                _.each(comp.value[k].value, setUpChain.bind(this, `${event}${k}.`), this);
                        }
                    };
                    _.each(this.value[key].value, setUpChain.bind(this, `change:${key}.`), this);
                    this.value[key].handlerSet = true;
                }
            }
            return this.value[key];
        },
        // Set the actual value of the component
        set: function(val) {
            if (val != this.value[key]) {
                this.handlerSet = false;
                let old = this.value[key].value;
                this.value[key] = val;
                this.trigger('component.change:?', `component.change:${key}`, val, old);
                this.trigger(`component.change:*`, key, val, old);
                this.trigger(`component.change:${key}`, val, old);
            }
        }
    };
    Object.defineProperties(target, o);
}