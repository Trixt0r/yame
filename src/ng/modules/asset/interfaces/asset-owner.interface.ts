import { Asset } from 'common/asset';

/**
 * An interface for defining a type which owns an asset.
 */
export interface IAssetOwner<T = unknown> {
  /**
   * The asset instance.
   */
  asset: Asset<T>;
}
