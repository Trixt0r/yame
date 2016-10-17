import * as _ from 'underscore';

import { Sprite } from '../graphics/sprite';
import { AbstractShape } from '../graphics/shape/abstract';
import Layer from './layer';

declare var pixicam;
var Pubsub = require('backbone').Events;

export class Map extends PIXI.Container {

    private _layers: Layer[];
    private _layersContainer: PIXI.Container;
    private _currentLayer: Layer;

    constructor () {
        super();
        this._layers = [];
        this._layersContainer = new PIXI.Container();
        this.addChild(this._layersContainer);
        this._currentLayer = this.createLayer('base');
    }

    /**
     * Creates a new layer and adds it to this map.
     * @param  {string} name
     * @returns {Layer} The created layer object.
     */
    createLayer(nameOrJSON: string, parentPath?: string): Layer {
        var layer = new Layer(nameOrJSON, parentPath);
        layer.z = this._layers.length;
        this._layers.push(layer);
        this._layersContainer.addChild(layer);
        if (!this._currentLayer)
            this.currentLayer = layer;
        this.emit('createLayer', layer);
        Pubsub.trigger('map:createLayer', this, layer);
        return layer;
    }

    /**
     * Removes the given layer from the map.
     *
     * @param {(string | Layer)} layer
     * @returns {boolean} Whether removing the layer was successful or not.
     */
    removeLayer(layer: string | Layer): boolean {
        if (typeof layer == 'string')
            layer = this.layerById(<string>layer);
        if (layer) {
            let idx = this._layers.indexOf(<Layer>layer);
            if (idx >= 0) {
                this._layers.splice(idx, 1);
                this._layersContainer.removeChild(<Layer>layer);
                this.emit('removeLayer', layer);
                Pubsub.trigger('map:removeLayer', this, layer);
                if (this._currentLayer === layer)
                    this.currentLayer = this._layers[Math.max(0, idx - 1)];
                return true;
            }
        }
        return false;
    }

    /**
     * Clones the given layer and returns it.
     * The cloned layer is automatically added to this map.
     *
     * @param {(string | Layer)} layer
     * @returns {Layer}
     */
    cloneLayer(layer: string | Layer): Layer {
        if (typeof layer == 'string')
            layer = this.layerById(<string>layer);
        (<any>layer).copies = ((<any>layer).copies || 0) + 1;
        let name = (<Layer>layer).name + '-copy-' +  (<any>layer).copies;
        let newLayer = this.createLayer(name);
        (<Layer>layer).objects.forEach((obj: any) => newLayer.addChild(obj.copy()));
        return newLayer;
    }

    /**
     * Sorts the layers by their z value.
     * @returns {void}
     */
    sortLayers() {
        let sorted = this._layers.sort((a, b) => a.z - b.z );
        this._layers = sorted;
        this._layersContainer.removeChildren();
        this._layers.forEach(child => this._layersContainer.addChild(child));
    }

    /**
     * Adds the given display object to the current layer.
     * @param  {PIXI.DisplayObject} child
     * @returns {void}
     */
    add(child: PIXI.DisplayObject) {
        this._currentLayer.addChild(child);
        this._currentLayer.sort();
    }

    /** @returns {Layer} The current layer. */
    get currentLayer(): Layer {
        return this._currentLayer;
    }

    /**
     * Sets the current layer of this map.
     * @param  {Layer}  layer If this parameter is `null`, nothing changes.
     * @returns {void}
     */
    set currentLayer(layer: Layer) {
        if (layer) {
            this._currentLayer = layer;
            this.emit('change:currentLayer', this._currentLayer);
            Pubsub.trigger('map:currentLayer', this, this._currentLayer);
        }
    }

    /**
     * Creates a copy of the given array of objects.
     *
     * @param {any[]} objects
     * @returns {any[]}
     */
    copyChildren(children: any[]): any[] {
        let newChildren = [];
        children.forEach(original => newChildren.push(original.copy()));
        return newChildren;
    }

    /**
     * @readonly
     * @type {Layer[]} The current layers.
     */
    get layers(): Layer[] {
        return this._layers.slice();
    }

    /**
     * Returns the layer with the given id.
     * @param  {string} name
     * @returns {Layer}
     */
    layerById(id: string): Layer {
        return _.find(this._layers, layer => layer.id == id);
    }

    /**
     * Returns the layer with the given name.
     * @param  {string} name
     * @returns {Layer}
     */
    layerByName(name: string): Layer {
        return _.find(this._layers, layer => layer.name == name);
    }

    /**
     * @param {string} id
     * @returns {(Sprite | AbstractShape)} An object for the given id.
     */
    objectById(id: string): Sprite | AbstractShape {
        let obj: Sprite | AbstractShape;
        _.each(this._layers, layer => {
            let arr = layer.getChildren([id]);
            if (arr.length && !obj) obj = arr[0];
        });
        return obj;
    }

    toJSON(parentPath: string): any {
        let re = {layers: []};
        re.layers = _.map(this._layers, layer => layer.toJSON(parentPath) );
        return re;
    }

    parse(json: any, parentPath: string) {
        this._layers.forEach(layer => {
            layer.clear();
            this.removeLayer(layer);
        });
        this.currentLayer = null;
        Pubsub.trigger('map:parsing', json, parentPath);
        _.each(json.layers, (json: any) => {
            let layer = this.createLayer(json, parentPath);
            layer.emit('parse');
            this.emit('parseLayer', layer);
            Pubsub.trigger('map:parseLayer', this, layer);
        } );
        this.currentLayer = this._layers[0];
        this.emit('parse');
        Pubsub.trigger('map:parse', this, this.currentLayer);
    }

    clearClick() {
        this.clearChildrenClick(this);
    }

    clearChildrenClick(parent) {
        for (var i in parent.children) {
            parent.children[i].clickPos = null;
            this.clearChildrenClick(parent.children[i]);
        }
    }
}

export default Map;