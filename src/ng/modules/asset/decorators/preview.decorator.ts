import { Type } from '@angular/core';
import { IAssetPreviewComponent } from '../directives/preview.directive';
import { AssetState } from '../states/asset.state';


/**
 * Registers an asset preview component for the given types.
 *
 * @param type The asset types for which the asset preview will be used.
 * @return A function, which adds the given component to the internal registry.
 */
export function AssetPreviewComponent(...types: string[]): Function {
  return (component: Type<IAssetPreviewComponent>) => {
    AssetState._initPreviewComponent(component, ...types);
  };
}