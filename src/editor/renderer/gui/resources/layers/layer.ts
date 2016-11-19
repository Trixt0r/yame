import Entity from '../../../../../core/renderer/graphics/entity';
import Tree from '../../../../../core/renderer/view/tree';
import View from '../../../../../core/renderer/view/abstract';
import List from '../../../../../core/renderer/view/list';
import Layer from '../../../../../core/renderer/scene/layer';
import Sprite from '../../../../../core/renderer/graphics/sprite';
import Input from '../../../../../core/renderer/view/input';
import Icon from '../../../../../core/renderer/view/icon';
import AbstractShape from '../../../../../core/renderer/graphics/shape/abstract';
import EventBus from '../../../../../core/common/eventbus';

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
             (<any>this.tree.$el.jstree(true)).delete_node('#' + child.id.value);
        });
        this.layer.on('parse', () => this.update());
    }

    /**
     * Adds the given child to the list of children.
     * @param  {any}    child
     * @returns {void}
     */
    addChild(child: Entity) {
        if (child instanceof Layer) console.log(child);
        else {
            let newNode = {
                id: child.id.value,
                text: child.id.value,
                type: 'object'
            };
            this.tree.$el.jstree(true).create_node('#' + this.layer.id, newNode);
        }
    }

    update() {
        let toRemove = _.map(this.layer.objects, obj => '#' + obj.id.value);
        this.tree.$el.jstree(true).delete_node(toRemove);
        this.layer.objects.forEach(obj => this.addChild(<any>obj));
    }

    get node(): any {
        return this._node;
    }
}

export default LayerControl;