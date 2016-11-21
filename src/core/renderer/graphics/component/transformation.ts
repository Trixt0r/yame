import {Component, define, component } from '../../../common/component';
import { Number } from '../../../common/component/number';
import { Point } from '../../../common/component/point';

@define('transformation')
export class Transformation
       extends Component<{ position?: Point,
                           scale?: Point,
                           rotation?: Number }> {

    /** @type {Point} position The position of the transformation. */
    @component position: Point;

    /** @type {Point} scale The scale of the transformation. */
    @component scale: Point;

    /** @type {Number} rotation The roation of the transformation. */
    @component rotation: Number;

    constructor(protected _name ? : string) {
        super(_name, { });
        this._value.position = new Point('position');
        this._value.scale = new Point('scale', {x: 1, y: 1});
        this._value.rotation = new Number('rotation', 0);
    }

    /** @inheritdoc */
    get type(): string {
        return 'transformation';
    }

    /** @inheritdoc */
    copy(): Transformation {
        let copy = new Transformation();
        copy.value.position = this.position.copy();
        copy.value.scale = this.scale.copy();
        copy.value.rotation = this.rotation.copy();
        return copy;
    }

    /**
     * Applies all components to the given PIXI display object.
     *
     * @param {PIXI.DisplayObject} displayObject
     * @chainable
     */
    apply(displayObject: PIXI.DisplayObject): Transformation {
        this.position.apply(displayObject.position);
        this.scale.apply(displayObject.scale);
        displayObject.rotation = this.rotation.value;
        return this;
    }

    /**
     * Applies the given PIXI display object to this transformation component.
     *
     * @param {PIXI.DisplayObject} displayObject
     * @chainable
     */
    sync(displayObject: PIXI.DisplayObject): Transformation {
        this.position.sync(displayObject.position);
        this.scale.sync(displayObject.scale);
        this.rotation.value = displayObject.rotation;
        return this;
    }
}

export default Transformation;