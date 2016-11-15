import { Transformation } from './component/transformation';
import { Number } from 'core/common/component/number';
import { Point } from 'core/common/component/point';
import { Component } from 'core/common/component';
import { Components } from '../../common/components';

export class Entity extends PIXI.Container {

    private comps: Components<any>;

    constructor() {
        super();
        this.comps = new Components();

        this.comps.value.transformation = new Transformation();

        // Listen for changes on the transformation components and apply them
        this.transformation.position.x.on('change', x => this.position.x = x);
        this.transformation.position.y.on('change', y => this.position.y = y);

        this.transformation.scale.x.on('change', x => this.scale.x = x);
        this.transformation.scale.y.on('change', y => this.scale.y = y);

        this.transformation.skew.x.on('change', x => this.skew.x = x);
        this.transformation.skew.y.on('change', y => this.skew.y = y);

        this.transformation.rotation.on('change', rot => this.rotation = rot);
    }

    /**
     * @readonly
     * @type {Components} components The components this entity owns.
     */
    get components(): Components<any> {
        return this.comps;
    }

    /**
     * @readonly
     * @type {Transformation} transformation Shortcut for components.value...
     */
    get transformation(): Transformation {
        return this.comps.value.transformation;
    }
}