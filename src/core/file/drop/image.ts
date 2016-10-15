import { DropHandlers } from './handlers';

/**
 * Default Drophandler for images. Accepts *.png and folders of images.
 */
export class ImageDropHandler extends DropHandlers {
    constructor() {
        super();
        this.setTypes(['file:png', 'file:jpg', 'file:jpeg']);
    }
}
