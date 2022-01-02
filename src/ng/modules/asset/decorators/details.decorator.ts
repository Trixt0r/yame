import { AssetState } from '../states/asset.state';
import { IAssetDetailsComponent } from '../interfaces';

/**
 * Registers an asset details component for the given types.
 *
 * @param type The asset types for which the asset details will be used.
 * @returns A function, which adds the given component to the internal registry.
 */
export function AssetDetailsComponent(...types: string[]): Function {
  return function decorator(component: IAssetDetailsComponent): void {
    AssetState._initDetailsComponent(component, ...types);
  };
}
