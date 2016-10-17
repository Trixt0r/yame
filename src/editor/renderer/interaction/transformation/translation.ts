import Interface = require('./interface');
import Enums = require('../enums');
import Selection = require('../selection');

import {Container} from './container';

/**
 * Transformation class for translating a selection container.
 */
export class Translation implements Interface.Transformation {

    constructor(private container: Container, private selection: PIXI.Rectangle) {}

    /** @inheritdoc */
    mousedown(position: PIXI.Point): boolean {
        return false;
    }

    /** @inheritdoc */
    mousemove(position: PIXI.Point, clickedPosition: PIXI.Point): boolean {
        this.container.position.x = position.x - clickedPosition.x;
        this.container.position.y = position.y - clickedPosition.y;
        if (Selection.snapToGrid)
            Selection.snapPosition(this.container.position);
        return true;
    }

    /** @inheritdoc */
    mouseup(position: PIXI.Point): boolean {
        return false;
    }

    /** @inheritdoc */
    type(): Enums.EditType {
        return Enums.EditType.DRAG;
    }

    /** @inheritdoc */
    update(children):void { }
}
