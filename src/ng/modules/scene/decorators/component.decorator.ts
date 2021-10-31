import { Injector } from '@angular/core';
import { IOProcessor, registerIO } from 'common/scene/component.io';
import { Type } from 'common/type';

type Options = Pick<IOProcessor, 'id' | 'type'>;

/**
 * Key under which component I/O metadata is stored.
 */
 export const META_COMPONENT_IO_KEY = '__componentIOMeta';

 /**
  * Describes metadata being added to decorated component I/O classes.
  */
interface ComponentIOMetadata {
  /**
  * Serializer methods registered for being called when serializing certain components.
  */
  serializerMethods: { [name: string]: Options };

  /**
  * Deserializer methods registered for being called when deserializing certain components.
  */
  deserializerMethods: { [name: string]: Options };
}

/**
* Definition for a component I/O class with metadata.
*/
export interface ComponentIOClass extends Type {
  /**
  * Metadata for a component I/O processor.
  */
  [META_COMPONENT_IO_KEY]: ComponentIOMetadata;
}

/**
* An internal list of all component I/O classes.
*/
const classes: ComponentIOClass[] = [];

/**
 * Makes sure default component I/O metadata is set on the given target class.
 *
 * @param target The target class.
 * @returns The input target, for chaining.
 */
 function ensureDefaultMetaData(target: any): ComponentIOClass {
  if (!target[META_COMPONENT_IO_KEY]) {
    const meta: ComponentIOMetadata = {
      serializerMethods: { },
      deserializerMethods: { }
    };
    Object.defineProperty(target, META_COMPONENT_IO_KEY, { value: meta });
    classes.push(target);
  }
  return target;
}

/**
 * Returns metadata for the given target, if any.
 *
 * @param target The target class.
 */
export function getComponentIOMetadata(target: any): ComponentIOMetadata {
  return target[META_COMPONENT_IO_KEY];
}

/**
 * Registers the actual component I/O class instances retrieved by the given injector.
 * Needs to be called during angular initialization.
 *
 * @param injector The injector instance of the current module.
 */
export function decorateComponentIOInstances(injector: Injector): void {
  classes.forEach((clazz: ComponentIOClass) => {
    const instance = injector.get(clazz) as any;
    const meta = getComponentIOMetadata(clazz);
    function applyIOHandler(
      methodName: 'serializerMethods' | 'deserializerMethods',
      mapTo: 'serialize' | 'deserialize'
    ) {
      const obj = meta[methodName] as { [key: string]: Partial<IOProcessor> };
      Object.entries(obj).forEach(([key, options]) => {
        registerIO({
          ...options,
          async [mapTo]() {
            return instance[key].apply(instance, arguments);
          },
        });
      });
    }
    applyIOHandler('serializerMethods', 'serialize');
    applyIOHandler('deserializerMethods', 'deserialize');
  });
}

/**
 * Decorates a method for being called as a serializer function on the configured components.
 *
 * @param options Options for declaring on which components the method should be called.
 */
export function Serialize(options: Options = { }) {
  return function(target: any, name: string): void {
    ensureDefaultMetaData(target.constructor)
      [META_COMPONENT_IO_KEY].serializerMethods[name] = options;
  }
}

/**
 * Decorates a method for being called as a deserializer function on the configured components.
 *
 * @param options Options for declaring on which components the method should be called.
 */
export function Deserialize(options: Options = { }) {
  return function(target: any, name: string): void {
    ensureDefaultMetaData(target.constructor)
      [META_COMPONENT_IO_KEY].deserializerMethods[name] = options;
  }
}