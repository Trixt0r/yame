import { Type } from '@angular/core';
import { IAssetOwner } from '../interfaces';
import { AssetState } from '../states/asset.state';

/**
 * Registers an asset tab component for the given types.
 *
 * @param type The asset types for which the asset tab will be used.
 * @return A function, which adds the given component to the internal registry.
 */
export function AssetTabComponent(...types: string[]): Function {
  return (component: Type<IAssetOwner>) => {
    AssetState._initTabComponent(component, ...types);
  };
}
