import EDITOR from './globals';
import PluginManager from '../pluginManager';
import Env from '../../core/common/environment';

declare var $, global;

import * as PIXI from 'pixi.js';
// Remove the console log
(<any>PIXI.utils)._saidHello = true;

import {remote} from 'electron';

import Map from '../../core/renderer/scene/map';
import Camera from '../../core/renderer/scene/camera';
import Zoom from '../../core/renderer/view/zoom';


var Pubsub = require('backbone').Events;


// Converts from degrees to radians.
Math['radians'] = function(degrees) {
  return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math['degrees'] = function(radians) {
  return radians * 180 / Math.PI;
};


let initGUI = function() {
    var $container = $('#pixi-container');
    $container.attr('draggable', true);

    $('body').on('mouseover', (e) => $container.attr('data-focus', e.target == EDITOR.renderer.view));

    let options = {
        transparent:true
    };

    var renderer = EDITOR.renderer = PIXI.autoDetectRenderer($container.outerWidth(), $container.outerHeight(),options);
    $container.append($(renderer.view));
    var map = EDITOR.map = new Map();
    var camera = EDITOR.camera = new Camera();
    camera.attach(map);

    let zoom = new Zoom(camera);
    zoom.render();
    $('.pusher').append(zoom.$el);

    // create the root of the scene graph
    var root = new PIXI.Container();
    root.interactive = true;

    root.addChild(map);


    window.onresize = function () {
        var w = $container.outerWidth();
        var h = $container.outerHeight();

        //this part resizes the canvas but keeps ratio the same
        renderer.view.style.width = w + "px";
        renderer.view.style.height = h + "px";
        $container.trigger('re-size');

        //this part adjusts the ratio:
        renderer.resize(w, h);

        camera.trigger('update');
    };


    // start animating
    animate();
    function animate() {
        // render the stage
        renderer.render(root);
        requestAnimationFrame(animate);
    }
    $(window).trigger('resize');

    Pubsub.trigger('renderer-ready', renderer, map, camera);
};

// If the document is ready setup the PIXI renderer and trigger all necessary
// events for the client side code.
window.addEventListener('load', () => {
    PluginManager.load().then(() => {
        PluginManager.run(null, remote.getCurrentWindow(), Env, Pubsub);
        initGUI();
    });
})
// window.onload = function (parameter) {
// }
