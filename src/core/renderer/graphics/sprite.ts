import Factory from '../../common/factory';
import Entity from '../../common/entity';

import utils = require('./utils');
import Backbone = require('backbone');
import * as path from 'path';

var math = require('mathjs');
var Pubsub = require('backbone').Events;

var randomstring = require("randomstring");

export class Sprite extends PIXI.Sprite implements Entity {

    private _id: string;
    private _z: number;
    private _layer: string;
    private _ready: boolean;

    constructor(texture: string) {
        super(PIXI.Texture.fromImage(texture));

        this._z = 0;
        this._id = path.basename(texture, path.extname(texture)) + '-' + randomstring.generate(8);
        this.interactive = true;
        this.setAnchor(0.5, 0.5);
        this._ready = this._texture.baseTexture.hasLoaded;
        if (!this._texture.baseTexture.hasLoaded)
            this._texture.on('update', () => {
                this._ready = true;
                this.emit('ready');
            });
    }

    /**
     * Sets the position of this sprite.
     * @param  {number} x
     * @param  {number} y
     * @returns {Sprite}
     */
    setPosition(x: number, y: number): Sprite {
        this.position.x = x;
        this.position.y = y;
        return this;
    }

    /**
     * Sets the anchor if this sprite.
     * @param  {number} x
     * @param  {number} y
     * @returns {Sprite}
     */
    setAnchor(x: number, y: number): Sprite {
        this.anchor.x = x;
        this.anchor.y = y;
        return this;
    }

    /** @inheritdoc */
    get id(): string {
        return this._id;
    }

    /** @inheritdoc */
    get type(): string {
        return 'Sprite';
    }

    /** @inheritdoc */
    set id(val: string) {
        let prev = this._id;
        if (prev != val) {
            this._id = val;
            this.emit('change:id', this._id);
        }
    }

    /** @inheritdoc */
    get z(): number {
        return this._z;
    }

    /** @inheritdoc */
    set z(value: number) {
        this._z = value;
        this.emit('change:z', this._z);
        Pubsub.trigger('graphic:z sprite:z', this);
    }

    /** @inheritdoc */
    get layer(): string {
        return this._layer;
    }

    /** @inheritdoc */
    set layer(layer: string) {
        this._layer = layer;
        this.emit('change:layer', this._layer);
        Pubsub.trigger('graphic:layer sprite:layer', this);
    }

    /**
     * @readonly
     * @type {boolean} Whether the the texture has been loaded or not.
     */
    get ready(): boolean {
        return this._ready;
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
            tint: this.tint,
            alpha: this.alpha,
            texture: path.relative(parentPath, this.texture.baseTexture.imageUrl)
        };
    }

    /** @inheritdoc */
    parse(json, parentPath: string) {
        this.texture = PIXI.Texture.fromImage(path.resolve(parentPath, json.texture));
        if (json.position)
            this.position = new PIXI.Point(json.position.x, json.position.y);
        if (json.scale)
            this.scale = new PIXI.Point(json.scale.x, json.scale.y);
        if (json.skew)
            (<any>this).skew = new PIXI.Point(json.skew.x, json.skew.y);
        this.rotation = json.rotation || 0;
        this.tint = json.tint || 0xFFFFFF;
        this.alpha = json.alpha || 1;
    }

    copy(): Sprite {
        let sprite = new Sprite(this.texture.baseTexture.imageUrl);
        sprite.position = new PIXI.Point(this.position.x, this.position.y);
        sprite.scale = new PIXI.Point(this.scale.x, this.scale.y);
        sprite.rotation = this.rotation;
        sprite.tint = this.tint;
        sprite.alpha = this.alpha;
        return sprite;
    }
}

export default Sprite;

/**
 * Factory for creating sprites.
 */
export class SpriteFactory implements Factory<Sprite> {
    /** @inheritdoc */
    getInstance(file): Sprite {
        return new Sprite(file[0]);
    }
}
