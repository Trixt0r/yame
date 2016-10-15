import {View} from '../../../core/view/abstract';
import {LabeledInput} from '../../../core/view/composition/labeledInput';
import {EventBus} from '../../../core/eventbus';

import _ = require('underscore');

export class Point extends View {

    private _x: LabeledInput;
    private _y: LabeledInput;

    constructor(options: any = {}) {
        super(_.extend({
            title: 'Point',
            className: 'ui segment'
        }, options));

        let instance = options.instance;

        let title = new View({ el: `<div class="ui tiny header">${options.title}</div>` });
        this._x = new LabeledInput({
            label: { text: 'x' },
            input: { value: (<any>instance).x, type: 'number' }
        });
        this._x.bindTo(instance, 'x', true);

        this._y = new LabeledInput({
            label: { text: 'y' },
            input: { value: (<any>instance).y, type: 'number' }
        });
        this._y.bindTo(instance, 'y', true);
        this.add(title).add(this._x).add(this._y);
    }

    /** @returns {LabeledInput} The input view for the x component. */
    get x(): LabeledInput {
        return this._x;
    }

    /** @returns {LabeledInput} The input view for the y component. */
    get y(): LabeledInput {
        return this._y;
    }
}
