import * as PIXI from 'pixi.js';
import Camera from '../camera';
import PubSub from '../../../../common/pubsub';

/**
 * Initializes mouse handler for the given arguments.
 * If this function gets called on the given camera, the user will be able to move the given target by using the right
 * mouse button and zoom the camera by using the scroll wheel.
 * @param  {PIXI.WebGLRenderer|PIXI.CanvasRenderer} renderer
 * @param  {Camera}             camera
 * @param  {PIXI.DisplayObject} target
 * @returns {void}
 */
export default function init (renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
                              camera: Camera,
                              target: PIXI.DisplayObject) {
  // We allow only targets with parents
  if (!target.parent) throw 'Only targets with a parent allowed';

  renderer.view.addEventListener('mousewheel', e => {
    let data = renderer.plugins.interaction.eventData.data;
    camera.targetPosition = data.getLocalPosition(target.parent, null, {x: e.clientX, y: e.clientY});
    if (e.wheelDelta > 0)
        camera.zoom = camera.maxZoom;
    else if (e.wheelDelta < 0)
        camera.zoom = camera.minZoom;
    }, false);

  let prevPos: PIXI.Point = null;
  let camPos: PIXI.Point = null;
  $(renderer.view).on('mousedown', e => {
    if (e.which !== 3) return; // Only listen for right click
    let data = renderer.plugins.interaction.eventData.data;
    prevPos = data.getLocalPosition(target.parent, null, {x: e.clientX, y: e.clientY});
    camPos = new PIXI.Point(camera.position.x, camera.position.y);
  });

  $('body').on('mouseup', e => {
    if (e.which !== 3) return; // Only listen for right click
    prevPos = null;
  });

  $('body').on('mousemove', e => {
    if (e.which !== 3 || !prevPos) return; // Only listen for right click
    let data = renderer.plugins.interaction.eventData.data;
    let pos = data.getLocalPosition(target.parent, null, {x: e.clientX, y: e.clientY});
    camera.position.x = camPos.x + (pos.x - prevPos.x);
    camera.position.y = camPos.y + (pos.y - prevPos.y);
    camera.emit('update');
    PubSub.emit('camera:update', camera);
  });
}