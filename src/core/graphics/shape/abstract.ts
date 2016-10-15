import {Entity} from '../../entity';

import utils = require('../utils');

var randomstring = require("randomstring");
var Pubsub = require('backbone').Events;
var tempPoint = new PIXI.Point();

export abstract class AbstractShape extends PIXI.Container implements Entity {

    private _id: string;
    private _z: number;
    private _layer: string;
    protected _graphics: PIXI.Graphics;

    constructor(... args) {
        super();
        this._z = 0;
        this._graphics = new PIXI.Graphics();
        this.interactive = true;
        this._id = 'shape-' + randomstring.generate(8);

        this.render.apply(this, args);

        this.hitArea = this.getLocalBounds();
        this.addChild(this._graphics);
    }

    /**
     * Render function of any specific shape.
     * Called in the constructor after the id has been set, before the the
     * graphics container has been appended to this container.
     * @param args {any[]} Arguments passed in the constructor.
     * @returns {void}
     */
    protected abstract render(args: any[]);

    /**
     * @returns {PIXI.Graphics} The object which renders th
     */
    get graphics(): PIXI.Graphics {
        return this._graphics;
    }

    /**
     * Tests if a point is inside this rectangle
     *
     * @param point {PIXI.Point} the point to test
     * @returns {boolean} the result of the test
     */
    containsPoint(point: PIXI.Point): Boolean {
        this.worldTransform.applyInverse(point,  tempPoint);

        var width = this.getLocalBounds().width;
        var height = this.getLocalBounds().height;
        var x1 = -width / 2;
        var y1;
        if ( tempPoint.x > x1 && tempPoint.x < x1 + width ) {
            y1 = -height / 2;
            if ( tempPoint.y > y1 && tempPoint.y < y1 + height )
                return true;
        }
        return false;
    }

    /** @inheritdoc */
    get z(): number {
        return this._z;
    }

    /** @inheritdoc */
    set z(value: number) {
        this._z = value;
        this.emit('change:z', this._z);
        Pubsub.trigger('graphic:z shape:z', this);
    }

    /** @inheritdoc */
    get type(): string {
        return 'Shape';
    }

    /** @inheritdoc */
    set id(val: string) {
        this._id = val;
        this.emit('change:id', this._id);
        Pubsub.trigger('graphic:id shape:id', this);
    }

    /** @inheritdoc */
    get id(): string {
        return this._id;
    }

    /** @inheritdoc */
    get layer(): string {
        return this._layer;
    }

    /** @inheritdoc */
    set layer(layer: string) {
        this._layer = layer;
        this.emit('change:layer', this._layer);
        Pubsub.trigger('graphic:layer shape:layer', this);
    }

    /** @inheritdoc */
    toJSON(parentPath: string): Backbone.ObjectHash {
        return {
            id: this.id,
            position: {
                x: this.position.x,
                y: this.position.y
            },
            scale: {
                x: this.scale.x,
                y: this.scale.y
            },
            rotation: this.rotation,
            alpha: this.alpha
        };
    }

    /** @inheritdoc */
    parse(json: any, parentPath: string) {
        this.position = json.position || new PIXI.Point();
        this.scale = json.scale || new PIXI.Point(1,1);
        this.rotation = json.rotation || 0;
        this.alpha = json.alpha || 1;
    }
}
