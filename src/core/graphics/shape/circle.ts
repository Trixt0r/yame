import {AbstractShape} from './abstract';

export class Circle extends AbstractShape {

    constructor(radius: number = 50) {
        super(radius);
    }

    /** @inheritdoc */
    protected render(radius?) {
        this._graphics.clear();
        this._graphics.lineStyle(5, 0x24e637);
        this._graphics.beginFill(0x24e637, .75);
        this._graphics.drawCircle(0, 0, radius);
        this._graphics.endFill();
    }

    /** @inheritdoc */
    get type(): string {
        return 'Circle';
    }
}
