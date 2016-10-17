import Enums = require('../enums');

export interface Transformation {

    /**
     * Called if the mouse has been pressed.
     * @param {PIXI.Point} position The mouse position.
     * @returns {boolean} Whether the event has been processed or not.
     */
    mousedown(position: PIXI.Point): boolean;

    /**
     * Called if the mouse has been moved.
     * @param {PIXI.Point} position The mouse position.
     * @param {PIXI.Point} clickPosition The mouse position during the click.
     * @returns {boolean} Whether the event has been processed or not.
     */
    mousemove(position: PIXI.Point, clickedPosition: PIXI.Point): boolean;

    /**
     * Called if the mouse button has been released
     * @param {PIXI.Point} position The mouse position.
     * @returns {boolean} Whether the event has been processed or not.
     */
    mouseup(position: PIXI.Point): boolean;

    /**
     * @returns {Enums.EditType} The type of this transformation object.
     */
    type(): Enums.EditType;

    /**
     * Updates this transformation object. No need to implemet this method.
     */
    update(added: any[]): void
}

export default Transformation;