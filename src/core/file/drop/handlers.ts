import { DropHandler } from './handler';
import { Payload } from './payload';
import {EventBus} from '../../eventbus';

/**
 * Implementation of a drophandler which can triggers events and anyone can
 * register their handlers to them.
 * Just listen for the `process`, `enter` and `leave` events.
 * Passed arguments are the same as defined in the interface for a drophandler.
 */
export class DropHandlers extends EventBus implements DropHandler {

    private _types: string[];

    constructor() {
        super();
        this._types = [];
    }

    /**
     * Sets the payload types for this handler.
     * @param  {string[]} types
     * @chainable
     */
    setTypes(types: string[]) {
        this._types = types;
        return this;
    }

    /** @inheritdoc */
    types() {
        return this._types;
    }

    /** @inheritdoc */
    process(payload: Payload, e: JQueryEventObject) {
        this.trigger('process', payload, e);
    }

    /** @inheritdoc */
    enter(payload: Payload, e: JQueryEventObject) {
        this.trigger('enter', payload, e);
    }

    /** @inheritdoc */
    leave(payload: Payload, e: JQueryEventObject) {
        this.trigger('leave', payload, e);
    }
}
