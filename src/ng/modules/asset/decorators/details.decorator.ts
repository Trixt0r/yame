import { Type } from '@angular/core';
import { IAssetDetailsComponent } from '../directives/details.directive';
import { AssetState } from '../states/asset.state';


/**
 * Registers an asset details component for the given types.
 *
 * @param type The asset types for which the asset details will be used.
 * @returns A function, which adds the given component to the internal registry.
 */
export function AssetDetailsComponent(...types: string[]): Function {
  return function decorator(component: Type<IAssetDetailsComponent>): void {
    AssetState._initDetailsComponent(component, ...types);
  };
}