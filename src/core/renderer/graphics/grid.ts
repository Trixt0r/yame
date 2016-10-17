import Camera from '../scene/camera';

/**
 * Class for rendering a grid in a specific 2D space.
 * @export
 * @class Grid
 */
export class Grid {

    public graphics: PIXI.Graphics;
    private color: number;
    private $container;
    public steps;

    constructor($container, public camera: Camera, public width: number = 128, public height: number = 128) {
        this.graphics = new PIXI.Graphics();
        this.steps = {
            x: 4,
            y: 4
        }
        camera.on('update', () => this.update($container.outerWidth(), $container.outerHeight()));
    }

    screenToWorld(point) {
        var newPoint = this.camera.container.toLocal(point);
        newPoint.x = Math.floor(newPoint.x / this.width) * this.width;
        newPoint.y = Math.floor(newPoint.y / this.height) * this.height;
        return newPoint;
    }

    update(width:number, height: number) {

        var topLeft = this.screenToWorld({ x: 0, y: 0 });
        var botLeft = this.screenToWorld({ x: 0, y: height });
        botLeft.y += this.height;
        var topRight = this.screenToWorld({ x: width, y: 0 });
        topRight.x += this.width;
        var botRight = this.screenToWorld({ x: width + this.width, y: height});
        botRight.x += this.width; botRight.y += this.height;

        width =  topRight.x - topLeft.x;
        height = botLeft.y - topLeft.y;

        this.graphics.clear();
        this.graphics.lineStyle(Math.max(1/this.camera.zoom, 1), 0x4e4e4e);

        var xSteps = Math.ceil(width/this.width);
        var ySteps = Math.ceil(height/this.height);

        for (var x = 0; x <= xSteps; x++) {
            var xx = topLeft.x + x*this.width;

            if ( xx % (this.steps.x * this.width) == 0) this.graphics.lineStyle(Math.max(5/this.camera.zoom, 5), 0x4e4e4e);
            else this.graphics.lineStyle(Math.max(1/this.camera.zoom, 1), 0x4e4e4e);

            this.graphics.moveTo(xx, topLeft.y);
            this.graphics.lineTo(xx, topLeft.y + height);
        }
        for (var y = 0; y <= ySteps; y++) {
            var yy = topLeft.y +  y*this.height;

            if ( yy % (this.steps.y * this.height) == 0) this.graphics.lineStyle(Math.max(5/this.camera.zoom, 5), 0x4e4e4e);
            else this.graphics.lineStyle(Math.max(1/this.camera.zoom, 1), 0x4e4e4e);

            this.graphics.moveTo(topLeft.x, yy);
            this.graphics.lineTo(topLeft.x + width, yy);
        }
    }
}

export default Grid;