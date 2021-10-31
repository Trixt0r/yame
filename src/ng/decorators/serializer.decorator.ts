import { Type } from 'common/type';

export const META_SERIALIZER_KEY = '__serializerMetadata';

/**
 * Serializer metadata being injected into an decorated class.
 */
interface SerializerMetadata {
  /**
   * The key under which to write/read the data to/from.
   */
  key?: string;

  /**
   * The write method to call on the serializer instance.
   */
  writeMethod?: string;

  /**
   * The read methods to call on the serializer instance.
   */
  readMethod?: string;
}

/**
 * A serializer class contains metadata for
 */
interface SerializerClass extends Type {
  [META_SERIALIZER_KEY]: SerializerMetadata;
}

/**
 * An internal list of registered serializer classes.
 */
const serializerClasses: SerializerClass[] = [];

/**
 * Returns all registered serializer classes.
 *
 * @return The serializer classes.
 */
export function getSerializerClasses(): SerializerClass[] {
  return serializerClasses;
}

/**
 * Makes sure the given target has serializer metadata.
 *
 * @param target The target to add the metadata to.
 * @return The target with new type information.
 */
export function ensureSerializerMetadata(target: any): SerializerClass {
  if (!target[META_SERIALIZER_KEY]) {
    const value: SerializerMetadata = {};
    Object.defineProperty(target, META_SERIALIZER_KEY, { value });
    serializerClasses.push(target);
  }
  return target;
}

/**
 * Decorates a method for being called during the write process of an editor file.
 * Make sure your class is injectable.
 *
 * @param key The key to store the written data to.
 */
export function OnWrite(key: string) {
  return function (target: any, name: string): void {
    if (target.hasOwnProperty('prototype')) throw new Error('OnWrite does not support static methods!');
    const meta = ensureSerializerMetadata(target.constructor)[META_SERIALIZER_KEY];
    meta.key = key;
    meta.writeMethod = name;
  };
}

/**
 * Decorates a method for being called while reading the data of an editor file.
 * Make sure your class is injectable.
 *
 * @param key The key under which the data should be read from.
 */
export function OnRead(key: string) {
  return function (target: any, name: string) {
    if (target.hasOwnProperty('prototype')) throw new Error('OnRead does not support static methods!');
    const meta = ensureSerializerMetadata(target.constructor)[META_SERIALIZER_KEY];
    meta.key = key;
    meta.readMethod = name;
  };
}
