import {AbstractShape} from './shape/abstract';
import {Rectangle} from './shape/rectangle';
import {Circle} from './shape/circle';
import {Polygon} from './shape/polygon';
import Factory from '../../common/factory';

export class ShapeFactory implements Factory<AbstractShape> {
    getInstance(args: any[]): AbstractShape {
        var type = args[0];
        switch(type) {
            case 'rectangle': return new Rectangle();
            case 'circle': return new Circle();
            case 'polygon': return new Polygon([new PIXI.Point(0,0), new PIXI.Point(100,0), new PIXI.Point(0,100)]);
        }
    }
}
