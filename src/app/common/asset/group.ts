import { AssetGroupContent } from './content/group';
import { Asset } from '../asset';

/**
 * An asset group represents an asset which contains children of assets.
 *
 * @export
 * @abstract
 * @class AssetGroup
 * @extends {Asset}
 * @template T
 */
export abstract class AssetGroup<U extends Asset, T extends AssetGroupContent<U>> extends Asset {

  /** @inheritdoc */
  get type(): string {
    return 'group';
  }

  /** @inheritdoc */
  content: T;

}
