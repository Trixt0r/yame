import {Renderer} from '../renderer';

export class TileRenderer extends Renderer {
    /** @inheritdoc */
    get type(): string {
        return 'tile';
    }
}