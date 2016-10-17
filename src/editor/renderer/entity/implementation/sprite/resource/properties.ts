import * as path from 'path';
import * as electron from 'electron';

import * as Utils from '../../../../../../core/renderer/drop/utils';

import View from '../../../../../../core/renderer/view/abstract';
import Image from '../../../../../../core/renderer/view/image';

export class PropertiesView extends View {

    image: Image;
    private selecting: boolean;

    constructor(options: any = {}) {
        super(options);

        this.image = new Image({
            className: 'ui image centered',
            attributes: { style: 'max-height: 200px' }
        });

        this.add(this.image);

        this.image.$el.on('dragstart', (e: any) => {
            let ext = path.extname(this.image.src).replace('.', '');
            Utils.setPayload(e, 'file:' + ext, this.image.src);
        });
    }
}

export default PropertiesView;