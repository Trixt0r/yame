import { Payload } from './payload';

/**
 * Interface for dropping objects onto a DOM element.
 */
export interface DropHandler {
    /**
     * Payload types this handler supports.
     * Example: ['file:txt', 'file:json', 'object:shape'];
     * @returns {string[]}
     */
    types(): string[];

    /**
     * Method which gets executed on a payload drop.
     * @param  {Payload} payload
     * @param  {Event} e
     * @returns {any}
     */
    process(payload: Payload, e: JQueryEventObject): any;

    /**
     * Method which gets executed on a entered payload drag.
     * @param  {Payload} payload
     * @param  {Event} e
     * @returns {any}
     */
    enter(payload: Payload, e: JQueryEventObject): any;


    /**
     * Method which gets executed on if a payload drag ended.
     * @param  {Payload} payload
     * @param  {Event} e
     * @returns {any}
     */
    leave(payload: Payload, e: JQueryEventObject): any;
}
