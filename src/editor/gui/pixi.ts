import EDITOR from '../globals';

import Backbone = require('backbone');
import { Grid } from '../../core/graphics/grid';
import { Sprite } from '../../core/graphics/sprite';
import CameraInteraction = require('../interaction/camera');
import Selection = require('../interaction/selection');
import {Translation} from '../interaction/transformation/translation';
import {Scale} from '../interaction/transformation/scale';
import {Rotation} from '../interaction/transformation/rotation';
import * as Resources from '../resources';

import {Map} from '../../core/scene/map';
import {Camera} from '../../core/scene/camera';

import {Payload} from '../../core/file/drop/payload';
import {DropManager} from '../../core/file/drop/manager';
import {ImageDropHandler} from '../../core/file/drop/image';

import {Resource} from '../entity/resource';
import {SpriteResource} from '../entity/implementation/sprite/resource';


import * as Promise from 'bluebird';

// Set a converter for png files
Resource.setConverter(['file:png', 'file:jpg'], (payload: Payload) => {
    return new Promise<SpriteResource>((resolve) => {
        let resource = new SpriteResource(payload.content);
        if (PIXI.loader.resources[payload.content])
            resolve(resource);
        else {
            PIXI.loader.add(payload.content);
            PIXI.loader.once('complete', () => resolve(resource));
            PIXI.loader.load();
        }
    });
});

var Pubsub = require('backbone').Events;

export class Pixi extends Backbone.View<Backbone.Model> {

    $container;
    public imageDropHandler: Resources.ImageDropHandler;
    public grid: Grid;
    private preview: PIXI.DisplayObject;
    private previews: PIXI.DisplayObject[];
    private _dropManager: DropManager;

    constructor() {
        super();
        this.previews = [];
        // Initialize interactions
        CameraInteraction.init();

        this.$container = $('#pixi-container');

        this._dropManager = new DropManager(this.$container);
        let handler = new ImageDropHandler();
        handler.on('process', (payload) => {
            Resource.fromPayload(payload)
                    .then(resource => this.addFromResource(resource));
        });
        handler.on('enter', (payload, e) => {
            Resource.fromPayload(payload)
                    .then(resource => this.beginPreview(resource, e));
        });
        handler.on('leave', payload => this.cancelPreview());
        this._dropManager.add(handler);

        var grid = this.grid = new Grid(this.$container, EDITOR.camera);
        Selection.grid = grid;
        EDITOR.map.addChild(grid.graphics);
        EDITOR.map.addChild((<any>EDITOR.map)._layersContainer);
        EDITOR.camera.trigger('update');

        EDITOR.map.interactive = true;

        Selection.init();

        Selection.registerTransformation(new Scale(Selection.getSelectionContainer(), Selection.getSelectionRectangle()));
        Selection.registerTransformation(new Translation(Selection.getSelectionContainer(), Selection.getSelectionRectangle()));
        Selection.registerTransformation(new Rotation(Selection.getSelectionContainer(), Selection.getSelectionRectangle()));

        this.$container.on('dragover', (e) => {
            this.$container.css('cursor', 'point');
            (<any>EDITOR.renderer).plugins.interaction.mapPositionToPoint(
                (<any>EDITOR.renderer).plugins.interaction.mouse.global,
                e.originalEvent.clientX,
                e.originalEvent.clientY);
            if (this.preview)
                this.preview.position = this.getMapPosition(e.originalEvent.clientX, e.originalEvent.clientY);
        });
    }

    /**
     * @private Maps the given coordinates into the map space.
     * @param {number} x
     * @param {number} y
     * @returns {PIXI.Point}
     */
    private getMapPosition(x: number, y: number): PIXI.Point {
        let position = new PIXI.Point();
        (<any>EDITOR.renderer).plugins.interaction.mapPositionToPoint(position, x, y);
        position = EDITOR.map.toLocal(position);
        if (Selection.snapToGrid)
            Selection.snapPosition(position);
        return position;
    }

    /**
     *
     *
     * @param {Resource} resource
     * @param {any} e
     */
    beginPreview(resource: Resource, e?) {
        this.cancelPreview();
        resource.create().then(instance => {
            this.preview = <any>instance;
            this.previews.push(this.preview);
            if (e)
                this.preview.position = this.getMapPosition(e.originalEvent.clientX, e.originalEvent.clientY);
            else
                this.preview.position = EDITOR.map.toLocal((<any>EDITOR.renderer).plugins.interaction.mouse.global);
            this.preview.alpha = .25;
            EDITOR.map.addChild(this.preview);
        });
    }

    /**
     * Cancels the preview mode, i.e. removes all preview instances from the map
     */
    cancelPreview() {
        this.previews.forEach(preview => EDITOR.map.removeChild(preview));
        this.previews = [];
        this.preview = null;
        EDITOR.map.off('mousemove');
    }

    /**
     * Creates an entity from the resource and adds it to the current layer.
     * @param {Resource} resource
     * @param {*} e
     */
    addFromResource(resource: Resource, e?) {
        this.cancelPreview();
        // Clear the selection first, so the sorting works properly for a layer
        // when the new instance gets added
        Selection.clear();

        resource.create().then(entity => {
            let instance = <PIXI.Container><any>entity;
            (<any>instance).z = EDITOR.map.currentLayer.objects.length;
            EDITOR.map.add(instance);
            if (e)
                instance.position = this.getMapPosition(e.originalEvent.clientX, e.originalEvent.clientY);
            else {
                instance.position = EDITOR.map.toLocal((<any>EDITOR.renderer).plugins.interaction.mouse.global);
                if (Selection.snapToGrid)
                    Selection.snapPosition(instance.position);
            }
            Selection.select([instance]);
        });
    }

    get dropManager(): DropManager {
        return this._dropManager;
    }
}
