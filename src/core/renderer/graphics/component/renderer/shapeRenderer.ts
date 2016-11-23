import {Renderer} from '../renderer';

export class ShapeRenderer extends Renderer {
    /** @inheritdoc */
    get type(): string {
        return 'shape';
    }
}