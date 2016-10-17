import Interface = require('./interface');
import Enums = require('../enums');
import Selection = require('../selection');

import {Container} from './container';

import _ = require('underscore');

var Pubsub = require('backbone').Events;

var scalerSize = 20;

// List of all scalers
var scalers: any = {
    topLeft: new PIXI.Graphics(),
    topMid: new PIXI.Graphics(),
    topRight: new PIXI.Graphics(),
    bottomLeft: new PIXI.Graphics(),
    bottomMid: new PIXI.Graphics(),
    bottomRight: new PIXI.Graphics(),
    leftMid: new PIXI.Graphics,
    rightMid: new PIXI.Graphics()
};

// Temp reference for the last clicked scaler
var scalerClicked = null;

// Temp references for position and size
var origPos = {
    x: 0,
    y: 0
};

var origSize = {
    width: 0,
    height: 0
};

/**
 * Transformation class for scaling the selection container.
 */
export class Scale implements Interface.Transformation {

    private zoom: number = 1;

    constructor(private container: Container, private selection: PIXI.Rectangle) {
        // Render the scalers
        this.renderScalers();
        // Register event handlers on each scaler
        _.each(scalers, (graphic: PIXI.Graphics) => {
            (<any>graphic).mousedown = data => {
                // Switch the mode to scaling
                Selection.dragMode = Enums.EditType.SCALE;
                // Updated the clicked scaler
                scalerClicked = graphic;


                origPos.x = this.container.position.x;
                origPos.y = this.container.position.y;

                // Update the original size
                origSize.width = this.container.scale.x * this.selection.width;
                origSize.height = this.container.scale.y * this.selection.height;
            };
        });
        container.on(`change:scale.x`, () => this.updateScalerSize());
        container.on(`change:scale.y`, () => this.updateScalerSize());
        Pubsub.on('camera:update', camera => this.zoom = camera.zoom);
        Pubsub.on('camera:update', this.updateScalerSize.bind(this));
    }

    /**
     * Updates the size of all scalers
     * @returns {void}
     */
    private updateScalerSize() {
        var scale = scalerSize + Selection.lineWidth;
        var scaleX = 1 / this.container.scale.x / this.zoom;
        var scaleY = 1 / this.container.scale.y / this.zoom;
        var pivotX = (scale - scale / scaleX ) / 2;
        var pivotY = (scale - scale / scaleY ) / 2;
        _.each(scalers, (graphic: PIXI.Graphics) => {
            graphic.scale.set(scaleX, scaleY);
            graphic.pivot.set(pivotX, pivotY);
        });
    }

    /** @inheritdoc */
    mousedown(position: PIXI.Point): boolean {
        return false;
    }

    /** @inheritdoc */
    mousemove(position: PIXI.Point, clickedPosition: PIXI.Point): boolean {
        // These two variables are used for the position correction
        var horDir = 1;
        var vertDir = 1;

        // horDir and vertDir values depend on the clicked scaler
        if (scalerClicked == scalers.topLeft || scalerClicked == scalers.bottomLeft || scalerClicked == scalers.leftMid)
            horDir = -1;
        if (scalerClicked == scalers.topLeft || scalerClicked == scalers.topRight || scalerClicked == scalers.topMid)
            vertDir = -1;
        if (scalerClicked == scalers.topMid || scalerClicked == scalers.bottomMid)
            horDir = 0;
        if (scalerClicked == scalers.leftMid || scalerClicked == scalers.rightMid)
            vertDir = 0;

        // Make a copy of the selection container which has to be used to calculate the mouse positions
        // into the selectionContainer space.
        // We use a copy, since the size of the original container is chainging with each mouse move
        // which leads to undesired scaling behaviour.
        // This way scaling with a transformed selection works perfectly (rotated, scaled, etc...).
        var container = new PIXI.Container();
        container.rotation = this.container.rotation;
        container.position.set(this.container.position.x, this.container.position.y);
        container.width = origSize.width;
        container.height = origSize.height;

        // Get the original click position
        var initialClickPos = new PIXI.Point(clickedPosition.x + origPos.x, clickedPosition.y + origPos.y);
        var _pos = new PIXI.Point(position.x, position.y);
        // Snap both values to the grid if necessary
        if (Selection.snapToGrid) {
            Selection.snapPosition(initialClickPos);
            Selection.snapPosition(_pos);
        }
        // Transform the mouse positions into the selection container space
        initialClickPos = container.toLocal(initialClickPos);
        _pos = container.toLocal(_pos);

        // The distance, the mouse made in selection container space
        var diff = new PIXI.Point(_pos.x - initialClickPos.x, _pos.y - initialClickPos.y);

        // Calc the new scale
        var newScale = {
            x: (origSize.width + horDir * diff.x ) / this.selection.width,
            y: (origSize.height + vertDir * diff.y) / this.selection.height
        };

        // Update the scale
        this.container.scale.set(newScale.x, newScale.y);

        // Calculate the poistion shift
        var shift = {
            x: (horDir * ((newScale.x * this.selection.width)/2)),
            y: (vertDir * ((newScale.y * this.selection.height)/2))
        };

        // Get the position offset
        var offset = {
            x: horDir*origSize.width/2,
            y: vertDir*origSize.height/2
        };

        // Include the container angle when correcting the position
        var cos = Math.cos(this.container.rotation);
        var sin = Math.sin(this.container.rotation);

        // Correct the postion
        this.container.position.x = origPos.x - ((cos * offset.x) - (sin * offset.y)) + ((cos * shift.x) - (sin * shift.y));
        this.container.position.y = origPos.y - ((sin * offset.x) + (cos * offset.y)) + ((sin * shift.x) + (cos * shift.y));

        return false;
    }

    /** @inheritdoc */
    mouseup(position: PIXI.Point): boolean {
        return false;
    }

    /** @inheritdoc */
    type(): Enums.EditType {
        return Enums.EditType.SCALE;
    }

    /**
     * Renders all scalers
     */
    private renderScalers(camera?): void {
        // Render each scaler
        _.each(scalers, (graphic: PIXI.Graphics) => {
            graphic.width = scalerSize;
            graphic.height = scalerSize;
            graphic.interactive = true;
            graphic.hitArea = new PIXI.Rectangle(0,0, scalerSize, scalerSize);
        });
        this.renderBorders();
    }

    private renderBorders(camera?) {
        this.zoom = camera ? camera.zoom : 1;
        _.each(scalers, (graphic: PIXI.Graphics) => {
            graphic.clear();
            graphic.lineStyle(Selection.lineWidth / this.zoom , Selection.color);
            graphic.beginFill(0xffffff);
            graphic.drawRect(0,0, scalerSize / this.zoom, scalerSize / this.zoom);
            graphic.endFill();
        });
    }

    /** @inheritdoc */
    update(children: any[]): void {
        // TODO: if possible enable scaling for multiple children
        // To prevent skewing issues, only scale the container if one child is in it
        if (children.length > 1) return;
        var topLeft = {
            x: -this.selection.width/2,
            y: -this.selection.height/2
        };

        _.each(scalers, (graphic: PIXI.Graphics) => {
            graphic.scale.set(1);
            graphic.pivot.set(0,0);
        });

        // Update the positions based on the current selection size
        scalers.topLeft.position.set(topLeft.x - scalers.topLeft.width / 2, topLeft.y - scalers.topLeft.height / 2);

        scalers.topRight.position.set(topLeft.x + this.selection.width - scalers.topRight.width / 2, topLeft.y - scalers.topRight.height / 2);

        scalers.topMid.position.set(topLeft.x + this.selection.width/2 - scalers.topMid.width / 2, topLeft.y - scalers.topMid.height / 2);

        scalers.leftMid.position.set(topLeft.x - scalers.leftMid.width / 2, topLeft.y  + this.selection.height/2- scalers.leftMid.height / 2);

        scalers.rightMid.position.set(topLeft.x + this.selection.width - scalers.rightMid.width / 2,topLeft.y  + this.selection.height/2- scalers.rightMid.height / 2);

        scalers.bottomLeft.position.set(topLeft.x - scalers.bottomLeft.width / 2, topLeft.y + this.selection.height - scalers.bottomLeft.height / 2);

        scalers.bottomRight.position.set(topLeft.x + this.selection.width - scalers.bottomRight.width / 2, topLeft.y + this.selection.height - scalers.bottomRight.height / 2);

        scalers.bottomMid.position.set(topLeft.x + this.selection.width/2 - scalers.bottomMid.width / 2,topLeft.y + this.selection.height - scalers.bottomMid.height / 2);

        // Append each scaler to the selection container
        _.each(scalers, (graphic: PIXI.Graphics) => this.container.target.addChild(graphic));
        this.updateScalerSize();
    }
}
