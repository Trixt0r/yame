import * as _ from 'underscore';
import * as Promise from 'bluebird';

import Image from '../../../core/renderer/view/image';
import View from '../../../core/renderer/view/abstract';
import Payload from '../../../core/renderer/drop/payload';
import EventBus from '../../../core/common/eventbus';

import Entity from '../../../core/renderer/graphics/entity';//

/**
 * Converts the given payload into a resource.
 * @export
 * @interface Converter
 */
export interface Converter { (payload: Payload): Promise<Resource>; }

/**
 * A resource is a member of a library.
 * It can be added or removed from it.
 * Resources are used to create entities by entity managers.
 */
export abstract class Resource extends EventBus {

    /**
     * Identifier of this resource, will be generated based on initialization
     * the resource type.
     * @type {string}
     */
    protected _id: string;

    constructor() {
        super();
        this._id = _.uniqueId(this.type  + '-');
    }

    /** @returns {string} Identifier of this resource. */
    get id(): string {
        return this._id;
    }

    /** @returns {string} The display name of this resource. */
    get displayName(): string {
        return this._id;
    }

    /** @returns {string} Resource specific type. */
    type: string;

    /** @returns {Image} Icon for this resource inside any gui component. */
    image: Image;

    /** @returns {View} The view to edit this resource. */
    properties: View;

    /**
     * Creates an entity from this resource.
     * @abstract
     * @template E
     * @returns {Promise<E>}
     */
    abstract create(): Promise<Entity>;

    private static converters: {[type: string]: Converter} = {};

    /**
     * @static Converts the given payload into a resource, if the payload type
     * is supported.
     * @param {Payload} payload
     * @returns {Promise<Resource>}
     */
    static fromPayload(payload: Payload): Promise<Resource> {
        let convert = _.find(Resource.converters, (conv, type) => payload.type == type );
        if (convert)
            return convert(payload);
        else
            return Promise.resolve(null);
    }

    /**
     * @static Sets the given converter for the given payload type.
     * @param {string | string[]} type
     * @param {Converter} converter
     */
    static setConverter(type: string | string[], converter: Converter) {
        if (!(type instanceof Array))
            type = [<string>type];
        (<string[]>type).forEach(type => Resource.converters[type] = converter);
    }

    /**
     * @static
     * @param {string} type
     * @returns {Converter} The converter for the given payload type.
     */
    static getConverter(type: string): Converter {
        return Resource.converters[type];
    }

    /**
     * @static Deletes the converter for the given payload type.
     * @param {string} type
     */
    static unsetConverter(type: string) {
        delete Resource.converters[type];
    }
}

export default Resource;