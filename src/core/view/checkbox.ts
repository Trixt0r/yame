import { Bindable } from './bindable';

import * as _ from 'underscore';

export class Checkbox extends Bindable {

    constructor(options: any = { }) {
        super(_.extend({
            className: 'ui checkbox'
        }, options));

        (<any>this.$el).checkbox();
        this.on('done:render', () => (<any>this.$el).checkbox());
    }

}