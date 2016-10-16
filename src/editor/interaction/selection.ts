import { Layer } from './../../core/scene/layer';
import EDITOR from '../globals';

import Enums = require('./enums');
import _ = require('underscore');

import {Map} from '../../core/scene/map';
import {Camera} from '../../core/scene/camera';
import {Transformation} from './transformation/interface';
import {Container} from './transformation/container';

import {Sprite} from '../../core/graphics/sprite';
import {AbstractShape} from '../../core/graphics/shape/abstract';

var Pubsub = require('backbone').Events;

/** @type {Enums.EditType} The current edit mode */
export var dragMode: Enums.EditType = Enums.EditType.DRAG;

/** @type {boolean} Whether to snap the mouse position to the grid or not. */
export var snapToGrid: boolean = false;

export function setSnapToGrid(val: boolean) {
    snapToGrid = val;
}

/** @type {boolean} Whether to snap the rotation to a certain angle or not. */
export var snapToAngle: boolean = false;

export function setSnapToAngle(val: boolean) {
    snapToAngle = val;
}

/** @type {Object} The grid dimesions, containing width and height as properties. */
export var grid = {width: 16, height: 16};

/** @type {Object} The angle snap value. */
export var angleSnap = 0;

export function setAngleSnap(val: number) {
    angleSnap = val;
}

/**
 * Snaps the given position to the grid.
 * The result is written in the given object back.
 * @param  {any} position An object containing x and y as properties.
 */
export function snapPosition(position): void {
    position.x = Math.round(position.x / grid.width) * grid.width;
    position.y = Math.round(position.y / grid.height) * grid.height;
}

var transformations = {};

/**
 * Registers a transformation instance.
 * @param  {Transformation.Transformation} trans
 */
export function registerTransformation (trans: Transformation): void {
    transformations[trans.type().toString()] = trans;
}

/**
 * @returns {Transformation} The current transformation instance.
 */
export function getTransformation(): Transformation {
    return transformations[dragMode];
}

var selectionContainer: Container = new Container();
var selectionRect: PIXI.Rectangle = new PIXI.Rectangle(0,0,0,0);

/**
 * @returns {PIXI.Container} The container, containing all selected children.
 */
export function getSelectionContainer(): Container {
    return selectionContainer;
}

/**
 * @returns {PIXI.Rectangle} The selection rectangle which gets drawn, when the
 * user drags the mouse around.
 */
export function getSelectionRectangle(): PIXI.Rectangle {
    return selectionRect;
}

/** @type {number} The line width for drawing lines in the selection container */
export var lineWidth: number = 3;

/** @type {number} The color for drawing lines. */
export var color: number = 0xc12626;

var world: Map, renderer, camera: Camera;

/**
 * Initializes the selection handling of the user.
 * Registers mouse event handlers on the seleciton container and the html body
 * to work properly.
 * @param  {Object} world  The global world instance.
 * @param  {Object} renderer The PIXI renderer.
 */
export function init(): void {
    world = EDITOR.map;
    renderer = EDITOR.map;
    camera = EDITOR.camera;
}

/**
 * Selects the given display objects.
 * @param  {PIXI.DisplayObject[]} children
 * @returns {void}
 */
export function select(children: PIXI.DisplayObject[], silent: boolean = false) {
    selectionContainer.position.set(0, 0);
    selectionContainer.scale.set(1, 1);
    selectionContainer.target.pivot.set(0, 0);
    selectionContainer.rotation = 0;
    selectionContainer.target.hitArea = new PIXI.Rectangle(0,0,0,0);

    children.forEach(child => selectionContainer.target.addChild(child));

    var bounds: PIXI.Rectangle;
    if (children.length === 1) {
        let child = children[0];
        // The container obtains the child's scale and the child resets the
        // scale since it will retrieve the scale anyway on deselect
        selectionContainer.scale.set(child.scale.x, child.scale.y);
        selectionContainer.position.set(child.position.x, child.position.y);
        selectionContainer.rotation = child.rotation;
        // selectionContainer.target.skew.set(child.skew.x, child.skew.y);
        child.scale.set(1,1);
        // child.skew.set(0,0);
        child.position.set(0, 0);
        child.rotation = 0;
    }
    if (children.length) {

        var localBounds = selectionContainer.target.getLocalBounds();
        let topLeft:any = world.toLocal(new PIXI.Point(localBounds.x, localBounds.y), selectionContainer.target);
        selectionRect.x = topLeft.x;
        selectionRect.y = topLeft.y;
        selectionRect.width = localBounds.width;
        selectionRect.height = localBounds.height;

         // Re-position container and children if there are multiple selections
        if (children.length > 1) {
            selectionContainer.target.pivot.set(localBounds.width/2, localBounds.height/2);
            selectionContainer.position.x = topLeft.x + localBounds.width/2;
            selectionContainer.position.y = topLeft.y + localBounds.height/2;
            children.forEach(child => child.position = selectionContainer.target.toLocal(child.position, world.currentLayer) );
            // Calc the local bounds after re-positioning children and set the hitArea
            localBounds = selectionContainer.target.getLocalBounds();
        }

        // Click area is always local bounds
        selectionContainer.target.hitArea = localBounds;

        var gr = new PIXI.Graphics();
        selectionContainer.target.addChild(gr);
        gr.clear();

        topLeft = {
            x: localBounds.x,
            y: localBounds.y
        };
        let localWidth = localBounds.width;
        let localHeight = localBounds.height;

        gr.moveTo(topLeft.x, topLeft.y);
        gr.lineStyle(lineWidth / camera.zoom / Math.abs(selectionContainer.scale.y) , color);
        gr.lineTo(topLeft.x + localWidth, topLeft.y);
        gr.lineStyle(lineWidth / camera.zoom / Math.abs(selectionContainer.scale.x) , color);
        gr.lineTo(topLeft.x + localWidth, topLeft.y + localHeight);
        gr.lineStyle(lineWidth / camera.zoom / Math.abs(selectionContainer.scale.y) , color);
        gr.lineTo(topLeft.x, topLeft.y + localHeight);
        gr.lineStyle(lineWidth / camera.zoom / Math.abs(selectionContainer.scale.x) , color);
        gr.lineTo(topLeft.x, topLeft.y);

        var fn = () => {
            gr.clear();

            gr.moveTo(topLeft.x, topLeft.y);
            gr.lineStyle(lineWidth / camera.zoom / Math.abs(selectionContainer.scale.y) , color);
            gr.lineTo(topLeft.x + localWidth, topLeft.y);
            gr.lineStyle(lineWidth / camera.zoom / Math.abs(selectionContainer.scale.x) , color);
            gr.lineTo(topLeft.x + localWidth, topLeft.y + localHeight);
            gr.lineStyle(lineWidth / camera.zoom / Math.abs(selectionContainer.scale.y) , color);
            gr.lineTo(topLeft.x, topLeft.y + localHeight);
            gr.lineStyle(lineWidth / camera.zoom / Math.abs(selectionContainer.scale.x) , color);
            gr.lineTo(topLeft.x, topLeft.y);
        };

        selectionContainer.off('change:scale.x', null, selectionContainer);
        selectionContainer.off('change:scale.y', null, selectionContainer);
        camera.off('update', null, selectionContainer);
        selectionContainer.on('change:scale.x', fn, selectionContainer);
        selectionContainer.on('change:scale.y', fn, selectionContainer);

        camera.on('update', fn, selectionContainer);

        _.each(<any>transformations, (trans: Transformation) => trans.update(children));
        if (!silent)
            Pubsub.trigger('selection:select', children);
    }
    else {
        selectionRect.width = 0;
        selectionRect.height = 0;
    }
}

/**
 * Clears the current selection, i.e. removes all children from the selection
 * container.
 * @returns {void}
 */
export function clear(silent: boolean = false) {
    let children = [];
    selectionContainer.target.children.forEach((child) => {
        if (child instanceof Sprite || child instanceof AbstractShape) {
            children.push(child);
        }
    });
    selectionContainer.target.removeChildren();
    children.forEach((child: PIXI.DisplayObject, i) => {
        child.position = world.currentLayer.toLocal(selectionContainer.target.toGlobal(child.position));
        child.scale.x *= selectionContainer.scale.x;
        child.scale.y *= selectionContainer.scale.y;
        child.rotation += selectionContainer.rotation;
    });

    children.forEach(child => {
        let layer = world.layerById(child.layer);
        if (layer)
            layer.addChild(child);
        else
            world.add(child);
    });
    world.currentLayer.sort();


    selectionRect.width = 0;
    selectionRect.height = 0;
    if (!silent)
        Pubsub.trigger('selection:unselect');
}

/**
 * Selects all objects in the given layer.
 * @param {Layer} layer
 */
export function selectLayer(layer: Layer) {
    EDITOR.map.currentLayer = layer;
    clear();
    select(layer.objects);
}

/**
 * Convenience function for getting the currently selected objects.
 *
 * @export
 * @returns {((Sprite | AbstractShape)[])}
 */
export function get(): (Sprite | AbstractShape)[] {
    return getSelectionContainer().selection;
}

/**
 * @param {*} object Can be a single object or an array of objects.
 * @returns {boolean} Whether the given object(s) exist in the current selection.
 */
export function has(object: any): boolean {
    if (!Array.isArray(object))
        object = [object];
    let selection = get();
    return _.reduce(object, (acc, obj: any) =>
        acc && selection.indexOf(obj) >= 0, true);
}