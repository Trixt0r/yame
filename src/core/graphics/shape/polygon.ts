import {AbstractShape} from './abstract';

export class Polygon extends AbstractShape {

    constructor(public vertices: PIXI.Point[]) {
        super(vertices);
    }



    /** @inheritdoc */
    protected render(vertices?) {

        this._graphics.clear();
        this._graphics.beginFill(0xda4f0b, .5);
        this._graphics.lineStyle(1, 0xda4f0b);
        this._graphics.drawPolygon(vertices);
        this._graphics.endFill();

        var width = this._graphics.width;
        var height = this._graphics.height;
        var verts: PIXI.Point[] = [];
        for (let i = 0, len = vertices.length; i < len; i++) {
            let point = vertices[i];
            verts.push(new PIXI.Point(point.x - width/2, point.y - height / 2));
        }

        this._graphics.clear();
        this._graphics.beginFill(0xda4f0b, .5);
        this._graphics.lineStyle(5, 0xda4f0b);
        this._graphics.drawPolygon(verts);
        this._graphics.endFill();
        // console.log(this._graphics.width, this._graphics.height);
        // this.pivot.set(this._graphics.width/2, this._graphics.height/2);
    }

    /** @inheritdoc */
    get type(): string {
        return 'Polygon';
    }
}
