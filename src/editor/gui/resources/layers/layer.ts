import { Tree } from './../../../../core/view/tree';
import { View } from '../../../../core/view/abstract';
import { List } from '../../../../core/view/list';
import { Layer } from '../../../../core/scene/layer';
import { Editable } from '../../../../core/editable';
import { Sprite } from '../../../../core/graphics/sprite';
import { Input } from '../../../../core/view/input';
import { Icon } from '../../../../core/view/icon';
import { AbstractShape } from '../../../../core/graphics/shape/abstract';
import { EventBus } from '../../../../core/eventbus';

import * as Selection from '../../../interaction/selection';
import * as _ from 'underscore';

const Pubsub = require('backbone').Events;

/**
 * View for displaying all children for a specific layer.
 */
export class LayerControl {

    private _node: any;

    constructor(private layer: Layer, private tree: Tree) {

        this._node = {
            id: layer.id,
            text: layer.name,
            type: 'layer',
            children: []
        };

        this.layer.on('addChild', child => this.addChild(child));
        this.layer.on('removeChild', child => {
             (<any>this.tree.$el.jstree(true)).delete_node('#' + child.id);
        });
        this.layer.on('parse', () => this.update());
    }

    /**
     * Adds the given child to the list of children.
     * @param  {any}    child
     * @returns {void}
     */
    addChild(child: Editable) {
        if (child instanceof Layer) console.log(child);
        else {
            let newNode = {
                id: child.id,
                text: child.id,
                type: 'object'
            };
            this.tree.$el.jstree(true).create_node('#' + this.layer.id, newNode);
        }
    }

    update() {
        let toRemove = _.map(this.layer.objects, obj => '#' + obj.id);
        this.tree.$el.jstree(true).delete_node(toRemove);
        this.layer.objects.forEach(obj => this.addChild(<any>obj));
    }

    get node(): any {
        return this._node;
    }
}
