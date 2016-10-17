import * as _ from 'underscore';

/**
 * Simple factory interface for creating dynamic type instances.
 * @interface Factory
 * @template T
 */
export interface Factory<T extends Object> {
    /**
     * Returns an instance for the type of this factory.
     * @param  {any} ...args Arguments for instantiating the type.
     * @returns {T} The created instance of the type.
     */
    getInstance(... args): T;
}

export default Factory;
