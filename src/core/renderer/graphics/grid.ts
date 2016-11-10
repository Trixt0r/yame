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

    screenToWorld(point): PIXI.Point {
        var newPoint = this.camera.container.toLocal(point);
        newPoint.x = Math.floor(newPoint.x / this.width) * this.width;
        newPoint.y = Math.floor(newPoint.y / this.height) * this.height;
        return newPoint;
    }

    update(width:number, height: number) {

        let topLeft = this.screenToWorld({ x: 0, y: 0 });
        let botLeft = this.screenToWorld({ x: 0, y: height });
        botLeft.y += this.height;
        let topRight = this.screenToWorld({ x: width, y: 0 });
        topRight.x += this.width;
        let botRight = this.screenToWorld({ x: width + this.width, y: height});
        botRight.x += this.width; botRight.y += this.height;

        width = topRight.x - topLeft.x;
        height = botLeft.y - topLeft.y;

        this.graphics.clear();

        let xSteps = Math.ceil(width/ this.width);
        let ySteps = Math.ceil(height / this.height);

        this.graphics.beginFill(0x212121);
        this.graphics.lineStyle(0, 0);

        for (let x = 0; x <= xSteps; x++) {
            let xx = topLeft.x + x * this.width;
            let xOff = Math.round(xx / this.width) * this.width;
            for (let y = 0; y <= ySteps; y++) {
                let yy = topLeft.y + y * this.height;
                // Calculate the correct skip position, so we get a real grid
                let yOff = Math.round(yy / this.height) * this.width;
                let pos = xOff + yOff;
                if ( pos % (this.width * 2 ) == 0 )
                    continue;
                this.graphics.drawRect(xx, yy, this.width, this.height );
            }
        }
        this.graphics.endFill();
    }
}

export default Grid;