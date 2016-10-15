import * as EDITOR from '../globals';
import {Map} from '../../core/scene/map';
import {Camera} from '../../core/scene/camera';
var keyboardjs = require('keyboardjs');
var Pubsub = require('backbone').Events;

export var speed = 20;

/**
 * Initializes the keyboard and mouse handlers.
 * @param  {Scene.Camera}        camera
 * @param  {PIXI.CanvasRenderer} renderer
 * @returns {void}
 */
export function init() {
    var renderer = EDITOR.renderer;
    var map: Map = EDITOR.map;
    var camera: Camera = EDITOR.camera;
    speed = 20;
    initMouse();

    /**
     * Initializes handlers for the mouse event.
     * @returns {void}
     */
    function initMouse() {
        renderer.view.addEventListener("mousewheel", function (e) {
            var data = (<any>renderer).plugins.interaction.eventData.data;
            camera.targetPosition = data.getLocalPosition(map.parent, null, {x: e.clientX, y: e.clientY});
            if (e.wheelDelta > 0)
                camera.zoom = camera.maxZoom;
            else if (e.wheelDelta < 0)
                camera.zoom = camera.minZoom;
            }, false);

        renderer.view.addEventListener("mouseup", function (data) {
            EDITOR.map.clearClick();
        });
    }
    var prevPos = null;
    var camPos = null;
    $(EDITOR.renderer.view).on('mousedown', e => {
        if (e.which !== 3) return; // Only listen for right click
        var data = (<any>renderer).plugins.interaction.eventData.data;
        prevPos = data.getLocalPosition(EDITOR.map.parent, null, {x: e.clientX, y: e.clientY});
        camPos = new PIXI.Point(camera.position.x, camera.position.y);
    });

    $('body').on('mouseup', e => {
        if (e.which !== 3) return; // Only listen for right click
        prevPos = null;
    });

    $('body').on('mousemove', e => {
        if (e.which !== 3 || !prevPos) return; // Only listen for right click
        var data = (<any>renderer).plugins.interaction.eventData.data;
        var pos = data.getLocalPosition(map.parent, null, {x: e.clientX, y: e.clientY});
        camera.position.x = camPos.x + (pos.x - prevPos.x);
        camera.position.y = camPos.y  + (pos.y - prevPos.y);
        camera.trigger('update');
        Pubsub.trigger('camera:update', camera);
    });
}
