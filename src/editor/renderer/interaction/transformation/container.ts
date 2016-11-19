import Entity from '../../../../core/renderer/graphics/entity';
import Observer from '../../../../core/renderer/graphics/observer';

import * as _ from 'underscore';

export class Container extends Observer<PIXI.Container> {

    id: string = 'none';

    constructor() {
        super(new PIXI.Container());
    }

    get selection(): Entity[] {
        var arr = [];
        this._target.children.forEach(child => {
            if (child instanceof Entity)
                arr.push(child);
        });
        return arr;
    }
}

export default Container;