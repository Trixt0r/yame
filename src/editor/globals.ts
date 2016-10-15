import { Camera } from './../core/scene/camera';
import { Map } from './../core/scene/map';

export var renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;
export var map: Map;
export var camera: Camera;

export function hasRendererFocus() {
    return  $('#pixi-container').attr('data-focus') == 'true';
}