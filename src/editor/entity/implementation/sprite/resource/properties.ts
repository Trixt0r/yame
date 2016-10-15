import { View } from './../../../../../core/view/abstract';
import { Input } from '../../../../../core/view/input';
import { Icon } from '../../../../../core/view/icon';
import { Image } from '../../../../../core/view/image';

import * as Utils from '../../../../../core/file/drop/utils';
import * as path from 'path';

import { LabeledInput } from '../../../../../core/view/composition/labeledInput';

import * as electron from 'electron';

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
