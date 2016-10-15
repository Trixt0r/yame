export class Property {
    constructor(public name: string, public attribute: string, public mapFrom: Function = null, public mapTo: Function = null) {}
}

export interface Editable {
    /**
     * @type {string} The identifier of this editable
     */
    id: string;

    /**
     * Returns a list of properties of this editable, which can be modified.
     * @returns {Property[]}
     */
    properties(): Property[];

    /**
     * Registers an event hander on this editable.
     * @param  {any} ...any
     * @returns {void}
     */
    on(... any);
}
