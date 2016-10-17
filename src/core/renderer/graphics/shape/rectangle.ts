import AbstractShape from './abstract';

export class Rectangle extends AbstractShape {

    constructor(public width: number = 100, public height: number = 100) {
        super(width, height);
    }

    /** @inheritdoc */
    protected render(width?, height?) {
        this._graphics.clear();
        this._graphics.beginFill(0xda4f0b, .5);
        this._graphics.lineStyle(5, 0xda4f0b);
        this._graphics.drawRect(-width/2, -height/2, width, height);
        this._graphics.endFill();
    }

    /** @inheritdoc */
    get type(): string {
        return 'Rectangle';
    }
}

export default Rectangle;