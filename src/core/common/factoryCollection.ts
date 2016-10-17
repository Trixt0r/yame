import Factory from './factory';

/**
 * Class for collecting factories.
 */
export class FactoryCollection {
    private _factories = {};

    /**
     * @template T
     * @param {string} type
     * @returns {Factory<T>} The factory for the given type
     */
     get<T>(type: string): Factory<T> {
         return this._factories[type];
     }

     /**
      * Adds a factory for the given type.
      * @template T
      * @param {string} type
      * @param {Factory<T>} factory
      * @chainable
      */
     add<T>(type: string, factory: Factory<T>): FactoryCollection {
         this._factories[type] = factory;
         return this;
     }

     /**
      * Removes the current factory for the given type.
      * @param {string} type
      * @chainable
      */
     remove(type: string): FactoryCollection {
         delete this._factories[type];
         return this;
     }
}

export default FactoryCollection;