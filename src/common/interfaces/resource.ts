/**
 * A resource represents an object which may be used as an asset.
 *
 * This can be any data, such as size, dimensions, children, length, etc.
 */
export interface IResource<T = unknown> {

  /**
   * The uniform resource identifier. May point to the local machine or remote storage.
   */
  uri: string;

  /**
   * The name of the resource.
   */
  name: string;

  /**
   * The resource type.
   */
  type: string;

  /**
   * The source, from which this resource got loaded.
   */
  source: string;

  /**
   * A label for the resource, for pretty printing it on the screen.
   */
  label?: string;

  /**
   * The actual resource data.
   */
  data?: T;

  /**
   * The size in bytes.
   */
  size?: number;

  /**
   * Unix timestamp for the date of creation.
   */
  created?: number;

  /**
   * Unix timestamp for the last date of modification.
   */
  changed?: number;

  [key: string]: any;
}

export interface IResourceGroup<T = unknown> extends IResource<IResource<T>[]> {}