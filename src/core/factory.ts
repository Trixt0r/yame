import _ = require('underscore');

/**
 * Simple factory interface for creating dynamic type instances.
 */
export interface Factory<T extends Object> {
    /**
     * Returns an instance for the type of this factory.
     * @param  {any} ...args Arguments for instantiating the type.
     * @returns {T} The created instance of the type.
     */
    getInstance(... args): T;
}

/**
 * Class for collecting factories.
 */
export class FactoryCollection {
    private _factories = {};

     get<T>(type: string): Factory<T> {
         return this._factories[type];
     }

     add<T>(typeName: string, factory:  Factory<T>) {
         this._factories[typeName] = factory;
     }

     remove(typeName: string) {
         delete this._factories[typeName];
     }
}
