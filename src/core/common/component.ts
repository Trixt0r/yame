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
     * @abstract
     * @returns {Component<T>} A copy of this component.
     */
    abstract copy(): Component<T>;
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
    o[key] = {
        // Return the value which should be a component
        get: function() {
            return this.value[key];
        },
        // Set the actual value of the component
        set: function(val) {
            if (val != this.value[key].value) {
                let old = this.value[key].value;
                this.value[key] = val;
                this.trigger('change:*', key, val, old);
                this.trigger(`change:${key}`, val, old);
            }
        }
    };
    Object.defineProperties(target, o);
}