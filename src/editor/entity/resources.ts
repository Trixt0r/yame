import {Resource} from './resource';
import {EventBus} from '../../core/eventbus';

import _ = require('underscore');
var Pubsub = require('backbone').Events;

/**
 * Collection of resource types.
 * Used internally by a resource collection.
 */
class ResourceTypes extends EventBus {

    private types: string[];

    constructor() {
        super();
        this.types = [];
    }

    /**
     * @param  {string}  type
     * @returns {boolean} Whether the given type exists in this collection.
     */
    has(type: string): boolean {
        return this.types.indexOf(type) >= 0;
    }

    /**
     * Adds the given types.
     * The `add` event is triggered if the type has been added.
     * @param  {string[]} ...types
     * @chainable
     */
    add(...types: string[]): ResourceTypes {
        types.forEach(type => {
            if (!this.has(type)) {
                this.types.push(type);
                this.trigger('add', type);
            }
        });
        return this;
    }

    /**
     * Removes the given types.
     * The `remove` event is triggered on success with the type as an argument.
     * @param  {string[]} ...types
     * @chainbale
     */
    remove(...types: string[]): ResourceTypes {
        types.forEach(type => {
            let idx = this.types.indexOf(type);
            if (idx >= 0) {
                this.types.splice(idx, 1);
                this.trigger('remove', type);
            }
        });
        return this;
    }

    /**
     * @param  {T}       resource
     * @returns {boolean} Whether the given resource is supported or not.
     */
    supports(resource: Resource): boolean {
        return this.has(resource.type);
    }

    /** @returns {string[]} Copy of the internal types. */
    copy(): string[] {
        return this.types.slice();
    }
}

/**
 * A class representing a collection resources.
 * Such a collection is responsible for storing resources in an internal data
 * structure.
 */
export class Resources <T extends Resource> extends EventBus {

    /** @type {T[]} Internal resources storage. */
    protected _resources: T[];

    /** @type {string} The name of this collection. */
    public name: string;

    /** @type {ResourceTypes} Internal storage for the resource types. */
    protected _resourceTypes: ResourceTypes;

    constructor() {
        super();
        this._resources = [];
        this._resourceTypes = new ResourceTypes();
    }

    /** @returns {ResourceTypes<T>} The supported resource types. */
    get types(): ResourceTypes {
        return this._resourceTypes;
    }

    /**
     * Adds the given resources to the resources.
     * If a resource already existed in the libary, it won't be added once more.
     * The `add` and `added` events are triggered various times:
     * `add` will be triggered in this resources with the added resource as an
     * argument. `resources:add:*` and `resources:add:${resource.type}` will be
     * triggered afterwards on the public Backbone.Events system with the
     * resources instance and the added resource instance as arguments.
     * `added` will be triggered on each added resource with the resources
     * instance as an argument.
     * `added` will be triggered on this resources with all new added resources
     * array as an argument and `resources:added:*` will also be triggered on
     * the public Backbone.Events system with the libary instance and all new
     * added resources as arguments.
     * @param  {T[]}    ...resources The resources to add.
     * @chainbale
     */
    add(...resources: T[]) {
        let added = [];
        resources.forEach(resource => {
            if (!this.has(resource)) {
                if (!this._resourceTypes.supports(resource))
                    throw `The resource type "${resource.type}"
                            is not supported by the "${this.name}" resources.\n
                            Following types are supported:
                                ${this._resourceTypes.copy().join(', ')}.`;
                added.push(resource);
                this._resources.push(resource);
                this.trigger('add', resource);
                Pubsub.trigger('resources:add:*', this, resource);
                Pubsub.trigger(`resources:add:${resource.type}`, this, resource);
                resource.trigger('added', this);
            }
        });
        if (added.length > 0) {
            this.trigger('added', added);
            Pubsub.trigger('resources:added:*', this, added);
        }
        return this;
    }

    /**
     * Removes the given resources from this resources.
     * The `remove` and `remove` events are triggered various times:
     * `remove` will be triggered in these resources with the added resource as
     * an argument. `resources:remove:*` and `resources:remove:${resource.type}`
     * will be triggered afterwards on the public Backbone.Events system with
     * the resources instance and the removed resource instance as arguments.
     * `removed` will be triggered on each removed resource with the resources
     * instance as an argument.
     * `removed` will be triggered on this resources with all removed resources
     * array as an argument and `resources:removed:*` will also be triggered on
     * the public Backbone.Events system with the libary instance and all
     * removed resources as arguments.
     * @param  {T[]}    ...resources The resources to remove.
     * @chainbale
     */
    remove(...resources: T[]) {
        let removed = [];
        resources.forEach(resource => {
            let idx = this._resources.indexOf(resource);
            if (idx >= 0) {
                removed.push(resource);
                this._resources.splice(idx, 1);
                this.trigger('remove', resource);
                Pubsub.trigger('resources:remove:*', this, resource);
                Pubsub.trigger(`resources:remove:${resource.type}`,this,resource);
                resource.trigger('removed', this);
            }
        });
        if (removed.length > 0) {
            this.trigger('removed', removed);
            Pubsub.trigger('resources:removed:*', this, removed);
        }
        return this;
    }

    /**
     * @param  {T}       resource
     * @returns {boolean} Whether the given resource exists in these resources.
     */
    has(resource: T): boolean {
        let found = this.find(resource.id);
        return this._resources.indexOf(resource) >= 0  || !!found;
    }

    /**
     * @param  {string} id
     * @returns {T} The found resource for the given id or null/undefined.
     */
    find(id: string): T {
        return _.find(this._resources, res => id == res.id );
    }

    /** @returns {T[]} Copy of the current internal array. */
    get resources(): T[] {
        return this._resources.slice();
    }
}
