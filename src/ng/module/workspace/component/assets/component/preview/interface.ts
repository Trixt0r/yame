import { Asset } from 'common/asset';

/**
 * An interface for defining a component which is able to render a preview of a certain asset.
 *
 * @export
 * @interface AssetPreviewComponent
 */
export interface AssetPreviewComponent {
  asset: Asset;
}
