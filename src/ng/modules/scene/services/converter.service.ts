import { Asset } from 'common/asset';
import { Injectable, InjectionToken } from '@angular/core';
import { SceneComponent } from 'common/scene';
import { SceneConverterException } from '../exceptions/converter.service.exception';

/**
 * Converts the given asset to a scene component data object.
 * The function has to resolve the scene component.
 */
export interface ISceneAssetConverter<A extends Asset = Asset, S extends SceneComponent = SceneComponent> {
  execute(asset: A): Promise<S[]>;
}

/**
 * A map of asset to entity data converters.
 */
interface Converters {
  [key: string]: ISceneAssetConverter;
}

/**
 * Internal map of converters.
 */
const converters: Converters = { }

/**
 * The scene asset converter is responsible for registering asset to scene component converters.
 */
@Injectable({ providedIn: 'root' })
export class SceneAssetConverterService {

  /**
   * Registers an asset to scene component converter.
   *
   * @param type The asset type.
   * @param converter The converter function.
   */
  static register(type: string, converter: ISceneAssetConverter): void {
    if (converters[type]) {
      console.warn(`[converter.service] A converter for asset type "${type}" was already registered.`);
    }
    converters[type] = converter;
  }

  /**
   * Creates scene components from the given asset and resolves them.
   *
   * @param asset The asset to create the scene components for.
   */
  async get(asset: Asset): Promise<SceneComponent[]> {
    if (!this.has(asset)) throw new SceneConverterException(`Asset of type '${asset.type}' is not supported`);
    const converter = converters[asset.type];
    return converter.execute(asset);
  }

  /**
   * Checks for the existence of an asset converter for the given asset.
   *
   * @param asset
   * @returns Whether a converter for the given asset exists.
   */
  has(asset: Asset): boolean {
    const converter = converters[asset.type];
    return !!converter && ((typeof converter === 'object' && !!converter.execute) || typeof converter === 'function');
  }
}
