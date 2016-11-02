import { Number } from '../../common/component/number';
import { Point } from '../../common/component/point';
import { Component } from '../../common/component';
import { Components } from '../../common/components';

export class Entity extends PIXI.Container {

    private comps: Components;

    private skew: PIXI.Point;

    constructor() {
        super();
        this.comps = new Components();

        this.comps.value['position'] = new Point('position');
        this.comps.value['scale'] = new Point('scale');
        this.comps.value['skew'] = new Point('skew');
        this.comps.value['rotation'] = new Number('rotation', 0);

        // Listen for changes on the PIXI js components
        this.comps.value['position'].on('set:x change:x', x => this.position.x = x);
        this.comps.value['position'].on('set:y change:y', y => this.position.y = y);

        this.comps.value['scale'].on('set:x change:x', x => this.scale.x = x);
        this.comps.value['scale'].on('set:y change:y', y => this.scale.y = y);

        this.comps.value['skew'].on('set:x change:x', x => this.skew.x = x);
        this.comps.value['skew'].on('set:y change:y', y => this.skew.y = y);

        this.comps.value['rotation'].on('change', rotation => this.rotation = rotation);
    }

    /**
     * @readonly
     * @type {Components} components The components this entity owns.
     */
    get components(): Components {
        return this.comps;
    }
}