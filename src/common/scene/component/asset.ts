import { SceneComponent } from 'common/scene/component';

export interface AssetSceneComponent extends SceneComponent {

  /**
   * The asset id.
   */
  asset: string;

  /**
   * The asset types, this component can be assigned to.
   */
  allowedTypes?: string | string[];

}

/**
 * Creates a new asset component with the given parameters.
 *
 * @param id
 * @param asset
 * @param group
 */
export function createAssetComponent(id: string, asset?: string, group?: string): AssetSceneComponent {
  return {
    id,
    type: 'asset',
    group,
    asset,
    allowedTypes: []
  }
}
