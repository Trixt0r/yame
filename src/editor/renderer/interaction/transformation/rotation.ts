import Interface = require('./interface');
import Enums = require('../enums');
import Selection = require('../selection');

import {Container} from './container';

var Pubsub = require('backbone').Events;

var rotator = new PIXI.Graphics();

var radius = 20;

/**
 * Transformation class for rotating a selection container.
 */
export class Rotation implements Interface.Transformation {

    private lastRotation: number = 0;
    private rotator: PIXI.Graphics;
    private zoom: number = 1;
    private lclBndsY: number = 0;

    constructor(private container: Container, private selection: PIXI.Rectangle) {
        this.rotator = new PIXI.Graphics();
        this.rotator.lineStyle(Selection.lineWidth, Selection.color);
        this.rotator.beginFill(0xffffff);
        this.rotator.drawCircle(0, 0, radius);
        this.rotator.endFill();
        this.rotator.interactive = true;
        this.rotator.hitArea = new PIXI.Circle(0, 0, radius);

        // Render the arrow
        var arrowLength = 7.5;
        var arrowAngle = -Math.PI/2;
        var cos = Math.cos(arrowAngle);
        var sin = Math.sin(arrowAngle);
        this.rotator.moveTo(radius, 0);
        this.rotator.lineTo(radius + cos*arrowLength - sin*arrowLength, sin*arrowLength + cos*arrowLength);
        this.rotator.moveTo(radius, 0);
        this.rotator.lineTo(radius - cos*arrowLength + sin*arrowLength, sin*arrowLength + cos*arrowLength);

        // Change the mode on rotator click
        (<any>this.rotator).mousedown = data => Selection.dragMode = Enums.EditType.ROTATE;

        // Update the scale of the rotator as soon as the container got scaled
        this.container.on(`change:scale.x`, () => this.updateRotator());
        this.container.on(`change:scale.y`, () => this.updateRotator());
        Pubsub.on('camera:update', camera => {
            this.zoom = camera.zoom;
            this.rotator.scale.set((<any>Math).sign(this.container.scale.x) / this.container.scale.x / camera.zoom,
                                (<any>Math).sign(this.container.scale.y) / this.container.scale.y / camera.zoom);
            this.rotator.position.y = (this.lclBndsY - this.rotator.getLocalBounds().height / Math.abs(this.container.scale.y)  / camera.zoom);
        });
    }

    /**
     * Updates the rotator size and position
     * @returns {void}
     */
    private updateRotator() {
        this.rotator.scale.set((<any>Math).sign(this.container.scale.x) / this.container.scale.x / this.zoom,
                                (<any>Math).sign(this.container.scale.y) / this.container.scale.y / this.zoom);
        this.rotator.position.y = this.lclBndsY  - this.rotator.height;
    }

    /** @inheritdoc */
    mousedown(position: PIXI.Point): boolean {
        var clickedAngle = Math.atan2(position.y , position.x);
        this.lastRotation = Math.atan2(Math.sin(clickedAngle - this.container.rotation), Math.cos(clickedAngle - this.container.rotation));
        return true;
    }

    /** @inheritdoc */
    mousemove(position: PIXI.Point, clickedPosition: PIXI.Point): boolean {
        var newAngle = Math.atan2(position.y - this.container.position.y,  position.x - this.container.position.x);
        this.container.rotation = newAngle - this.lastRotation ;
        if (Selection.snapToAngle) {
            let snapAngle = Selection.angleSnap * PIXI.DEG_TO_RAD;
            if (snapAngle !== 0)
                this.container.rotation = Math.round(this.container.rotation / snapAngle) * snapAngle;
        }
        return true;
    }

    /** @inheritdoc */
    mouseup(position: PIXI.Point): boolean {
        return false;
    }

    /** @inheritdoc */
    type(): Enums.EditType {
        return Enums.EditType.ROTATE;
    }

    /** @inheritdoc */
    update(children): void {
        this.container.target.removeChild(this.rotator);
        this.lclBndsY = this.container.target.getLocalBounds().y;
        this.rotator.scale.set(1, 1);
        this.rotator.pivot.set(0,0);
        this.rotator.position.x = this.container.target.pivot.x;
        this.updateRotator();
        this.container.target.addChild(this.rotator);
    }
}
