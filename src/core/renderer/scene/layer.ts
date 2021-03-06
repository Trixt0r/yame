import { Entity } from '../graphics/entity';
import { ShapeFactory } from './../graphics/shapeFactory';
import {Sprite} from '../graphics/sprite';
import {AbstractShape} from '../graphics/shape/abstract';

import * as _ from 'underscore';

var Pubsub = require('backbone').Events;
var randomstring = require("randomstring");

/**
 * A layer is an extended PIXI.Container, which owns a name.
 */
export class Layer extends PIXI.Container {

    protected _id: string;
    protected _name: string;
    protected _children: Entity[];
    protected _sorted: boolean;
    protected _z: number;

    constructor(nameOrJSON: string | any, parentPath?: string) {
        super();
        this._children = [];
        if (typeof nameOrJSON === 'string' && !parentPath) {
            this._id = _.uniqueId('layer-') + '-' + randomstring.generate(8);
            this._name = nameOrJSON;
        }
        else
            this.parse(nameOrJSON, parentPath);
    }

    /**
     * Sorts the layer objects by their z value.
     * NOTE: Make sure that all children of this layer are in the layer's space.
     * @returns {void}
     */
    sort() {
        let sorted = this._children.sort((a, b) => a.z.value - b.z.value );
        this._children = sorted;
        this.removeChildren();
        this._children.forEach(child => super.addChild(child));
    }

    /** @inheritdoc */
    addChild(child: PIXI.DisplayObject): PIXI.DisplayObject {
        var re = super.addChild(child);
        if ((child instanceof Entity)) {
            if (this._children.indexOf(<any>child) < 0) {
                this._children.push(child);
                child.layer.value = this._id;
                this.emit('addChild', child);
                Pubsub.trigger('layer:addChild', this, child);
            }
            this.sort();
        }
        return re;
    }

    /** @inheritdoc */
    deleteChild(child: PIXI.DisplayObject): PIXI.DisplayObject {
        var re = super.removeChild(child);
        var idx = this._children.indexOf(<any>child);
        if (idx >= 0) {
            this._children.splice(idx, 1);
            this.emit('removeChild', child);
            Pubsub.trigger('layer:removeChild', this, child);
        }
        this.sort();
        return re;
    }

    /**
     * Adds the given children to this layer.
     * @param {any[]} children
     * @chainable
     */
    pasteChildren(children: any[]) {
        children.forEach(obj => this.addChild(obj));
        return this;
    }

    /**
     * Removes all children or the passed from this layer.
     * @param {any[]} [children=this._children] Optional array with children to
     * clear.
     * @chainable
     */
    clear(children: any[] = this._children): Layer {
        children.slice().forEach(child => this.deleteChild(child));
        return this;
    }

    /**
     * @param {string[]} ids List of ids to search for
     * @returns {Entity[]} The found children
     */
    getChildren(ids: string[]): Entity[] {
        return _.filter(this._children, child => ids.indexOf(child.id.value) >= 0);
    }

    /** @returns {PIXI.DisplayObject[]} List of sprites or shapes. */
    get objects(): Entity[] {
        return this._children.slice();
    }

    /**
     * Sets the name of this layer. 'layer:set:name' is triggered on the Pubsub.
     * @param  {string} name
     * @returns {void}
     */
    set name(name: string) {
        if (this._name != name) {
            let prev = this._name;
            this._name = name;
            this._children.forEach(child => child.layer.value = this._name);
            this.emit('change:name', name, prev);
            Pubsub.trigger('layer:change:name', this, name, prev);
        }
    }

    /**
     * @returns {string} The name of this layer.
     */
    get name(): string {
        return this._name;
    }

    /** @inheritdoc */
    get z(): number {
        return this._z;
    }

    /** @inheritdoc */
    set z(value: number) {
        if (this._z != value) {
            let prev = this._z;
            this._z = value;
            this.emit('change:z', this._z, prev);
            Pubsub.trigger('layer:change:z', this, this._z, prev);
        }
    }

    /** @inheritdoc */
    get id(): string {
        return this._id;
    }

    /** @inheritdoc */
    set id(value: string) {
        if (this._id != value) {
            let prev = this._id;
            this._id = value;
            this.emit('change:id', this._id, prev);
            Pubsub.trigger('layer:change:id', this, this._id, prev);
        }
    }

    toJSON(options?: any): any {
        return {
            id: this.id,
            name: this.name,
            alpha: this.alpha,
            z: this.z,
            children: _.map(this._children, child => _.extend( {
                type: child.renderer.type,
                layer: this.id
            }, child.toJSON(options) ) )
        }
    }

    parse(json: any, options?: any): Layer {
        this.clear();
        this._id = json.id;
        this._name = json.name;
        this._z = json.z;
        this.alpha = json.alpha || 1;
        _.each(json.children, (json: any) => {
            let obj = new Entity();
            obj.fromJSON(json, options);
            this.addChild(obj);
        });
        return this;
    }
}

export default Layer;