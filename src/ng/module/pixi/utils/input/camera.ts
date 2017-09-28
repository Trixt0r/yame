import * as PIXI from 'pixi.js';
import Camera from '../camera';

/**
 * Initializes mouse handler for the given arguments.
 * If this function gets called on the given camera, the user will be able to move the given target by using the right
 * mouse button and zoom the camera by using the scroll wheel.
 * @todo Check if we can use an angular approach to achieve this behaviour.
 * @todo Implement detaching, too.
 * @param  {PIXI.WebGLRenderer|PIXI.CanvasRenderer} renderer
 * @param  {Camera}             camera
 * @param  {PIXI.DisplayObject} target
 * @returns {void}
 */
export function init(renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer,
                              camera: Camera,
                              target: PIXI.DisplayObject) {
  // We allow only targets with parents
  if (!target.parent) throw 'Only targets with a parent allowed';

  let tmpPos = new PIXI.Point();

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
  renderer.view.addEventListener('mousedown', e => {
    if (e.which !== 3) return; // Only listen for right click
    let data = renderer.plugins.interaction.eventData.data;
    prevPos = data.getLocalPosition(target.parent, null, {x: e.clientX, y: e.clientY});
    camPos = new PIXI.Point(camera.position.x, camera.position.y);
  });

  document.body.addEventListener('mouseup', e => {
    if (e.which !== 3) return; // Only listen for right click
    prevPos = null;
  });

  document.body.addEventListener('mousemove', e => {
    if (e.which !== 3 || !prevPos) return; // Only listen for right click
    let data = renderer.plugins.interaction.eventData.data;
    let pos = data.getLocalPosition(target.parent, null, {x: e.clientX, y: e.clientY});
    tmpPos.set(camPos.x + (pos.x - prevPos.x), camPos.y + (pos.y - prevPos.y));
    camera.position = tmpPos;
  });
}

export default init;
