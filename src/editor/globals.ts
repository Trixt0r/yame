import { Camera } from './../core/scene/camera';
import { Map } from './../core/scene/map';

abstract class Global {
    public static renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;
    public static map: Map;
    public static camera: Camera;

    public static hasRendererFocus() {
        return  $('#pixi-container').attr('data-focus') == 'true';
    }
}

export default Global;