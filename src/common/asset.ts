import { IResource } from './interfaces/resource';

/**
 * An asset represents any resource which can be part of an entity.
 *
 * For instance this could be an image, atlas texture, particle object, sound file, etc.
 */
export class Asset<T = unknown> {

  /**
   * The unique identifier of the asset.
   */
  id!: string;

  /**
   * The type of the asset.
   */
  type!: string;

  /**
   * The parent of this asset. Is `null` if it is the root group.
   */
  parent: string | null = null;

  /**
   * A list of asset child ids, if any.
   */
  children: string[] = [];

  /**
   * The resource reference of the asset. Contains the actual data and further information
   */
  resource: IResource<T> = {
    uri: '',
    type: '',
    name: '',
    source: ''
  };

  /**
   * The icon to display.
   */
  icon?: string;

}
