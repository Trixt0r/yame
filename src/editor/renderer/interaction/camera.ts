import * as keyboardjs from 'keyboardjs';

import EDITOR from '../globals';
import Map from '../../../core/renderer/scene/map';
import Camera from '../../../core/renderer/scene/camera';

let Pubsub: Backbone.Events = require('backbone').Events;

export var speed = 20;

/**
 * Initializes the keyboard and mouse handlers.
 * @param  {Scene.Camera}        camera
 * @param  {PIXI.CanvasRenderer} renderer
 * @returns {void}
 */
export function init() {
    let renderer = EDITOR.renderer;
    let map: Map = EDITOR.map;
    let camera: Camera = EDITOR.camera;
    speed = 20;
    initMouse();

    /**
     * Initializes handlers for the mouse event.
     * @returns {void}
     */
    function initMouse() {
        renderer.view.addEventListener("mousewheel", function (e) {
            let data = (<any>renderer).plugins.interaction.eventData.data;
            camera.targetPosition = data.getLocalPosition(map.parent, null, {x: e.clientX, y: e.clientY});
            if (e.wheelDelta > 0)
                camera.zoom = camera.maxZoom;
            else if (e.wheelDelta < 0)
                camera.zoom = camera.minZoom;
            // let canvas = $('#pixi-container canvas');
            // canvas.css('background-size', `${camera.zoom*canvas.outerWidth()}px ${camera.zoom*canvas.outerHeight()}px`);
            }, false);

        renderer.view.addEventListener("mouseup", function (data) {
            EDITOR.map.clearClick();
        });
    }
    let prevPos = null;
    let camPos = null;
    $(EDITOR.renderer.view).on('mousedown', e => {
        if (e.which !== 3) return; // Only listen for right click
        let data = (<any>renderer).plugins.interaction.eventData.data;
        prevPos = data.getLocalPosition(EDITOR.map.parent, null, {x: e.clientX, y: e.clientY});
        camPos = new PIXI.Point(camera.position.x, camera.position.y);
    });

    $('body').on('mouseup', e => {
        if (e.which !== 3) return; // Only listen for right click
        prevPos = null;
    });

    $('body').on('mousemove', e => {
        if (e.which !== 3 || !prevPos) return; // Only listen for right click
        let data = (<any>renderer).plugins.interaction.eventData.data;
        let pos = data.getLocalPosition(map.parent, null, {x: e.clientX, y: e.clientY});
        camera.position.x = camPos.x + (pos.x - prevPos.x);
        camera.position.y = camPos.y + (pos.y - prevPos.y);
        // let canvas = $('#pixi-container canvas');
        // canvas.css('background-position-x', camera.position.x);
        // canvas.css('background-position-y', camera.position.y);
        camera.trigger('update');
        Pubsub.trigger('camera:update', camera);
    });
}
