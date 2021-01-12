import { Asset } from 'common/asset';
import { Injectable } from '@angular/core';
import { SceneComponent } from 'common/scene';
import { Type } from 'common/type';
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
   * Creates a scene component from the given asset and resolves it.
   *
   * @param asset The asset to create the scene component for.
   * @returns A promise which resolves the created scene component.
   */
  get(asset: Asset): Promise<SceneComponent[]> {
    if (!this.has(asset))
      return Promise.reject(new SceneConverterException(`Asset of type '${asset.type}' is not supported`));
    return converters[asset.type].execute(asset);
  }

  /**
   * Checks for the existence of an asset converter for the given asset.
   *
   * @param asset
   * @returns Whether a converter for the given asset exists.
   */
  has(asset: Asset): boolean {
    return !!converters[asset.type] && typeof converters[asset.type] === 'object' && !!converters[asset.type].execute;
  }
}

/**
 * Registers a scene asset converter.
 * You should use the method to register your asset converters,
 * so converting assets to scene component will work as expected.
 *
 * @param type The type(s) for which the asset converter will be used
 * @returns A converter function, which converts the given type(s) to scene components.
 */
export function SceneAssetConverter<T extends Type<ISceneAssetConverter>>(type: string | string[]): Function {
  return (converter: T) => {
    const types = Array.isArray(type) ? type : [type];
    const instance = new converter();
    types.forEach(assetType => SceneAssetConverterService.register(assetType, instance));
  };
}
