import EDITOR from '../../globals';

import Map from '../../../../core/renderer/scene/map';
import Camera from '../../../../core/renderer/scene/camera';
import Entity from 'core/renderer/graphics/entity';

import Tool from '../tool';
import Button from '../../gui/tools/button';


import Enums = require('../enums');
import SELECTION = require('../selection');
import * as Utils from  '../utils';

import * as keyboardjs from 'keyboardjs';

var Pubsub = require('backbone').Events;

export class Selection extends Tool {

    constructor() {
        super();

        var renderer = EDITOR.renderer;
        var map: Map = EDITOR.map;
        var camera: Camera = EDITOR.camera;
        var mousePos = new PIXI.Point();

        this.on('unselected', () => SELECTION.clear());

        var selectionContainer = SELECTION.getSelectionContainer();
        var selectionRect = SELECTION.getSelectionRectangle();
        var box = new PIXI.Graphics();
        var containerSelection = false;
        box.lineStyle(SELECTION.lineWidth , SELECTION.color);

        var renderSelection = () => {
            box.clear();
            if (containerSelection) return;
            box.lineStyle(SELECTION.lineWidth / camera.zoom , SELECTION.color);
            box.position.set(selectionContainer.position.x, selectionContainer.position.y);
            box.beginFill(SELECTION.color, .25);
            box.drawRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
            box.endFill();
        };

        map.addChild(box);
        map.addChild(selectionContainer);
        selectionContainer.interactive = true;

        let mouseOnRenderer = true;

        let ctrlKey = false;

        this.handle($('body'), 'keydown', e => ctrlKey = e.ctrlKey);
        this.handle($('body'), 'keyup', e => ctrlKey = e.ctrlKey);

        this.keyboard('ctrl+a', () => SELECTION.selectLayer(EDITOR.map.currentLayer));
        this.keyboard('ctrl+c', () => Utils.copy());
        this.keyboard('ctrl+x', () => Utils.cut());
        this.keyboard('ctrl+v', () => Utils.paste());
        this.keyboard('del', () => Utils.remove());

        Pubsub.on('editor:interaction:paste', pasted => {
            if (!this._tools.hasFocus) return;
            SELECTION.clear();
            SELECTION.select( pasted );
            let mouse = renderer.plugins.interaction.eventData.data.global;
            let local = EDITOR.map.toLocal(mouse);
            if (SELECTION.snapToGrid)
                SELECTION.snapPosition(local);
            selectionContainer.position.set(local.x, local.y);
        });

        let clickPos = null;

        selectionContainer.on('mousedown', data => {
            mouseOnRenderer = true;
            var target = data.target;
            containerSelection = true;
            let position = EDITOR.map.toLocal(data.data.global);
            let sPosition = selectionContainer.position;
            clickPos = {
                x: position.x - sPosition.x,
                y: position.y - sPosition.y
            };
            if (SELECTION.getTransformation()) {
                SELECTION.getTransformation().mousedown(clickPos);
                Pubsub.trigger('transformation:mousedown:' + SELECTION.dragMode);
            }
        });

        this.handle($('body'), 'mousemove', (e: JQueryEventObject) => {
            if (ctrlKey) return;
            if (!mouseOnRenderer) return;
            if (clickPos) {
                let position = new PIXI.Point();
                EDITOR.renderer.plugins.interaction.mapPositionToPoint(position, e.clientX, e.clientY);
                position = EDITOR.map.toLocal(position);
                if (SELECTION.getTransformation()) {
                    SELECTION.getTransformation().mousemove(position, clickPos);
                    Pubsub.trigger('transformation:mousemove:' + SELECTION.dragMode);
                    camera.targetPosition = map.toGlobal(position);
                }
                renderSelection();
            }
        });

        (<any>selectionContainer).mouseup = () => setTimeout(() => {
            if (mouseOnRenderer) containerSelection = false;
        });

        let mouseOverSelection = false;
        selectionContainer.on('mouseover', () => mouseOverSelection = true);
        selectionContainer.on('mouseout', () => mouseOverSelection = false);

        let drag = false;
        let downOnRenderer = true;
        let prevSelection = null;

        let rightClick = false;
        this.handle($(renderer.view), 'mousedown', e => {
            if (e.which === 3) return rightClick = true;
            if (e.which !== 1) return;
            if (ctrlKey) prevSelection = selectionContainer.selection;
            else prevSelection = null;
            if (containerSelection && !ctrlKey) return;
            drag = true;
            SELECTION.clear();
            mouseOverSelection = false;
            selectionContainer.position.set(0,0);
            // Reset the selection container and the rectangle.
            (<any>renderer).plugins.interaction.mapPositionToPoint(mousePos, e.clientX, e.clientY);
            var pos = map.toLocal(mousePos);
            selectionRect.x = pos.x;
            selectionRect.y = pos.y;
            selectionRect.width = 0;
            selectionRect.height = 0;
            renderSelection();
            map.removeChild(selectionContainer);
            map.addChildAt(selectionContainer, map.children.length);
            map.removeChild(box);
            map.addChildAt(box, map.children.length);
        });

        Pubsub.on('camera:update', () => rightClick = false);

        this.handle($(renderer.view), 'mouseup', e => {
            if (e.which === 3 && rightClick) {
                rightClick = false;
                let selection = SELECTION.get();
                let id = mouseOverSelection ? selection[0].id.value : EDITOR.map.currentLayer.id;
                Pubsub.trigger('editor:interaction:tools:selection:context', e, '#' + id);
            }
        })

        this.handle($('body'), 'mousedown', e => downOnRenderer = e.target == renderer.view);

        this.handle($('body'), 'mousemove', e => {
            (<any>renderer).plugins.interaction.mapPositionToPoint(mousePos, e.clientX, e.clientY);
            var pos = map.toLocal(mousePos);
            if (containerSelection) return;
            if (drag) {
                box.clear();
                box.lineStyle(SELECTION.lineWidth , SELECTION.color);
                selectionRect.width = pos.x - selectionRect.x;
                selectionRect.height = pos.y - selectionRect.y;
                renderSelection();
            }
        });

        this.handle($('body'), 'mouseup', e => {
            if (e.which !== 1) return;
            clickPos = null;
            var prevDragMode = SELECTION.dragMode;
            SELECTION.dragMode = Enums.EditType.DRAG;
            if (!downOnRenderer || (e.target !== renderer.view && containerSelection)) {
                mouseOnRenderer = false;
                containerSelection = false;
                return;
            }
            mouseOnRenderer = true;
            renderer.plugins.interaction.mapPositionToPoint(mousePos, e.clientX, e.clientY);
            var pos = map.toLocal(mousePos);
            if (containerSelection && e.target === renderer.view && !ctrlKey) {
                containerSelection = false;
                return;
            }
            let globRect = map.toGlobal(new PIXI.Point(selectionRect.x, selectionRect.y));
            selectionRect.x = globRect.x;
            selectionRect.y = globRect.y;
            selectionRect.width = mousePos.x - globRect.x;
            selectionRect.height = mousePos.y - globRect.y;
            drag = false;
            if (selectionRect.width < 0) {
                selectionRect.x += selectionRect.width;
                selectionRect.width *= -1;
            }
            if (selectionRect.height < 0) {
                selectionRect.y += selectionRect.height;
                selectionRect.height *= -1;
            }

            let addedChildren = [];
            if (prevSelection) addedChildren = prevSelection.slice();

            let rectPos = new PIXI.Point(selectionRect.x, selectionRect.y);
            let rectSize = new PIXI.Point(selectionRect.width, selectionRect.height);
            let rectTopLeft = rectPos;
            let rectTopRight = new PIXI.Point(rectPos.x + rectSize.x, rectPos.y);
            let rectBottomLeft = new PIXI.Point(rectPos.x, rectPos.y + rectSize.y);
            let rectBottomRight = new PIXI.Point(rectPos.x + rectSize.x, rectPos.y + rectSize.y);
            map.currentLayer.children.forEach((child: Entity) => {
                let bounds = child.getLocalBounds();
                // Get the actual internal size, so the other points get calculated properly
                let width = bounds.width;
                let height = bounds.height;
                // Convert local bounds to global coordinates
                let topLeft = child.toGlobal(new PIXI.Point(bounds.x, bounds.y));
                let topRight = child.toGlobal(new PIXI.Point(bounds.x + width, bounds.y));
                let bottomLeft = child.toGlobal(new PIXI.Point(bounds.x, bounds.y + height));
                let bottomRight = child.toGlobal(new PIXI.Point(bounds.x + width, bounds.y + height));
                // Check if bounds are inside the selection
                let contains = selectionRect.contains(topLeft.x, topLeft.y) ||
                                selectionRect.contains(topRight.x, topRight.y) ||
                                selectionRect.contains(bottomLeft.x, bottomLeft.y) ||
                                selectionRect.contains(bottomRight.x, bottomRight.y);
                // If not, check if rectangle bounds are inside the child
                if (!contains) {
                    contains = child.containsPoint(rectTopLeft) ||
                                child.containsPoint(rectTopRight) ||
                                child.containsPoint(rectBottomLeft) ||
                                child.containsPoint(rectBottomRight);
                }
                if (contains) {
                    let idx = addedChildren.indexOf(child);
                    if (idx >= 0) addedChildren.splice(idx, 1);
                    else addedChildren.push(child);
                }
            });
            SELECTION.select(addedChildren);
            camera.targetPosition = selectionContainer.toGlobal(new PIXI.Point());
            box.clear();
        });
    }

    /** @override */
    getButton(): Button {
        return new Button('wizard', 'Selection and transformation tool');
    }
}

export default Selection;