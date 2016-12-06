import { EventBus } from '../../common/eventbus';
import { String } from '../../common/component/string';
import { Renderer } from './component/renderer';
import { SpriteRenderer } from './component/renderer/spriteRenderer';
import { Component, component } from '../../common/component';
import { Transformation } from './component/transformation';
import { Number } from '../../common/component/number';
import { Point } from '../../common/component/point';

import * as randomstring from 'randomstring';

let tempPoint = new PIXI.Point();

class EntityComponents extends Component<any> implements EventBus {

    /** @type {String} id The id of the component. */
    @component id: String;

    /** @type {String} layer The layer of the component. */
    @component layer: String;

    /** @type {Number} z The z index of the component. */
    @component z: Number;

    /** @type {Transformation} transformation The transformation component */
    @component transformation: Transformation;

    /** @type {Renderer} renderer The renderer of the component. */
    @component renderer: Renderer;

    constructor(_name?: string) {
        super(name, { });
        this._value.id = new String('id', 'entity-' + randomstring.generate(8));
        this._value.layer = new String('layer', null);
        this._value.z = new Number('z', 0);
        this._value.transformation = new Transformation('transformation');
        this._value.renderer = new Renderer('renderer', new PIXI.Container());
    }

    /** @inheritdoc */
    get type(): string {
        return 'entity';
    }

    /** @inheritdoc */
    copy(): EntityComponents {
        let entity = new EntityComponents(this._name);
        entity.value.transformation = this.transformation.copy();
        entity.value.renderer = this.renderer.copy();
        entity.value.layer = this.layer.copy();
        entity.value.z = this.z.copy();
        return entity;
    }
}

export class Entity extends PIXI.Container {

    private comps: EntityComponents;

    constructor(components?: EntityComponents) {
        super();
        if (!components)
            this.comps = new EntityComponents('components');
        else
            this.comps = components;

        // Setup the event handlers
        this.updateComponents();

        // If any component changes, update everything
        this.comps.on('change:*', () => this.updateComponents());
    }

    /**
     * Helper method for updating all component event handlers.
     *
     * @protected
     */
    protected updateComponents() {
        // Clear the container
        this.removeChildren();

        // Listen for changes on the transformation components and apply them
        this.transformation.position.x.on('change', x => this.position.x = x);
        this.transformation.position.y.on('change', y => this.position.y = y);

        this.transformation.scale.x.on('change', x => this.scale.x = x);
        this.transformation.scale.y.on('change', y => this.scale.y = y);

        this.transformation.rotation.on('change', rot => this.rotation = rot);

        // Apply the current transformation to the PIXI attributes
        this.transformation.apply(this);

        if (this.renderer.displayObject) {
            this.addChild(this.renderer.displayObject);
            var bounds = this.getLocalBounds();
            this.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        }

        // If the renderer changes, remove the previous and add the new one
        this.renderer.on('change', (val, old) => {
            if (old)
                this.removeChild(old);
            this.addChild(val);
            var bounds = this.getLocalBounds();
            this.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        });
    }

    /**
     * @readonly
     * @type {EntityComponents} components The components this entity owns.
     */
    get components(): EntityComponents {
        return this.comps;
    }

    /**
     * @readonly
     * @type {String} id Shortcut for accessing the id component.
     */
    get id(): String {
        return this.comps.id;
    }

    /**
     * @readonly
     * @type {String} layer Shortcut for accessing the layer component.
     */
    get layer(): String {
        return this.comps.layer;
    }

    /**
     * @readonly
     * @type {Number} z Shortcut for accessing the z component.
     */
    get z(): Number {
        return this.comps.z;
    }

    /**
     * @readonly
     * @type {Transformation} transformation Shortcut for accessing the
     * transformation component.
     */
    get transformation(): Transformation {
        return this.comps.transformation;
    }

    /**
     * @readonly
     * @type {Renderer} renderer Shortcut for accessing the renderer component.
     */
    get renderer(): Renderer {
        return this.comps.renderer;
    }

    /**
     * Tests if a point is inside this entity.
     *
     * @param {PIXI.Point} point The point to test.
     * @returns {boolean} The result of the test.
     */
    containsPoint(point: PIXI.Point): boolean {
        this.worldTransform.applyInverse(point, tempPoint);
        let bounds = this.getLocalBounds();
        let width = bounds.width;
        let height = bounds.height;
        let x1 = bounds.x;
        if ( tempPoint.x > x1 && tempPoint.x < x1 + width ) {
            let y1 = bounds.y;
            if ( tempPoint.y > y1 && tempPoint.y < y1 + height )
                return true;
        }
        return false;
    }

    /**
     * Creates a copy of this entity.
     *
     * @returns {Entity} The copy.
     */
    copy(): Entity {
        let entity = new Entity(this.comps.copy());
        return entity;
    }

    /**
     * Serializes this entity and returns a JSON object.
     *
     * @param {*} [options]
     * @returns {*}
     */
    toJSON(options?: any): any {
        return this.comps.toJSON(options);
    }

    /**
     * Parses the given JSON object and applies it to this entity.
     *
     * @param {*} json
     * @param {*} [options]
     * @chainable
     */
    fromJSON(json: any, options?: any): Entity {
        switch(json.type) {
            case 'sprite': this.components.renderer = new SpriteRenderer('renderer', new PIXI.Sprite()); break;
            default: console.warn('Renderer for type', json.type, 'not found!');
        }
        this.comps.fromJSON(json, options);
        // Apply the current transformation to the PIXI attributes
        this.transformation.apply(this);
        return this;
    }

    /** @inheritdoc */
    trigger(event: string, ...args: any[]) {
        return this.emit.apply(this, arguments);
    }
}

export default Entity;