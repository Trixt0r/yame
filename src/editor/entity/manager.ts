import {EventBus} from '../../core/eventbus';
import {Payload} from '../../core/file/drop/payload';
import {Resource} from './resource';
import {Entity} from '../../core/entity';
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
