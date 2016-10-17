import Camera from '../../core/renderer/scene/camera';
import Map from '../../core/renderer/scene/map';

abstract class Global {
    public static renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;
    public static map: Map;
    public static camera: Camera;

    /**
     * @static
     * @returns {boolean} Whether the mouse is over the pixi container.
     */
    public static hasRendererFocus(): boolean {
        return  $('#pixi-container').attr('data-focus') == 'true';
    }
}

export default Global;