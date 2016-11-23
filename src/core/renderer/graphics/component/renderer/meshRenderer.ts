import {Renderer} from '../renderer';

export class MeshRenderer extends Renderer {
    /** @inheritdoc */
    get type(): string {
        return 'mesh';
    }
}