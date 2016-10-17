import EventBus from '../../../core/common/eventbus';
import {Resource} from './resource';
import {Resources} from './resources';

import * as Promise from 'bluebird';


export abstract class Manager extends EventBus {

    // protected _library: Resources<R>;

    constructor() {
        super();
        // this._library = new Resources<R>();
    }

    // get library(): Resources<R> {
    //     return this._library;
    // }
}
