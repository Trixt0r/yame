import { Component, define } from './component';

import * as _ from 'underscore';

/**
 * Proxy handler for component values.
 *
 * @class Handler
 * @implements {ProxyHandler<{[name: string]: Component<any>}>}
 */
class Handler implements ProxyHandler<any> {

    constructor(private comps: Components) {}

    /** @inheritdoc */
    set (target: any, p: PropertyKey, value: any, receiver: any): boolean {
        console.log(target, p);
        if (target[p] != value) {
            let wasSet = target[p] !== void 0;
            let old = target[p];
            target[p] = value;
            if (!wasSet) {
                this.comps.trigger('set', value, old, p);
                this.comps.trigger(`set:${p}`, value, old );
            } else {
                this.comps.trigger('change', value, old, p);
                this.comps.trigger(`change:${p}`, value, old );
            }
            return true;
        }
        return false;
    }

    /** @inheritdoc */
    deleteProperty (target: {[name: string]: Component<any>}, p: PropertyKey): boolean {
        if (target[p] !== void 0) {
            delete target[p];
            this.comps.trigger(`delete`, p);
            this.comps.trigger(`delete:${p}`);
            return true;
        }
        return false;
    }
}

@define('components')
export class Components extends Component<any> {

    constructor(protected _name ? : string) {
        super(_name);
        this._value = new Proxy({}, new Handler(this));
    }

    /** @inheritdoc */
    get type(): string {
        return 'components';
    }

    /** @inheritdoc */
    set value(val: any) {
        _.extend(this._value, val);
    }

    /** @inheritdoc */
    get value(): any {
        return this._value;
    }
}

export default Components;