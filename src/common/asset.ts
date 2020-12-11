import { AssetGroup } from './asset/group';
/**
 * The content details of an asset instance.
 *
 * Details of an asset can be anything, such as
 * file path, size, dimensions, children, length, etc.
 *
 * @interface AssetContent
 */
interface AssetContent {

  [key: string]: any;

}

/**
 * An asset represents any resource which can be part of an map as an instance,
 * this can be e.g. in form of an image, atlas texture, particle object, sound file, etc.
 *
 * @export
 * @abstract
 * @class Asset
 */
export abstract class Asset {

  /** The unique identifier of the asset. */
  id!: string;

  /** The type of the asset, e.g. file, directory, etc. */
  type!: string;

  /** The content of the asset. */
  content: AssetContent;

  /** The parent of this asset. Is `null` if it is the root group. */
  parent!: AssetGroup<Asset>;

  constructor() {
    this.content = { };
  }

}
