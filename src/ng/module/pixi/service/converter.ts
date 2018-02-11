import { DisplayObject } from "pixi.js";
import { Asset } from "../../../../common/asset";
import { PixiInvalidConverterException } from "../exception/service/invalid-converter";
import { PixiAssetNotSupportedException } from "../exception/service/asset-not-supported";

/**
 * Converts the given asset to a display object.
 * The function has to resolve the display object.
 *
 * @interface ConvertFn
 */
interface ConvertFn {
  (asset: Asset): Promise<DisplayObject>;
}

interface Converters {
  [key: string]: ConvertFn;
}

/**
 * Class responsible for registering asset to display object converters
 *
 * @export
 * @class Converter
 */
export class PixiAssetConverter {

  private converters: Converters = { };

  /**
   * Registers an asset to display object converter.
   *
   * @param {string} type The asset type.
   * @param {ConvertFn} converter The converter function.
   * @returns {void}
   */
  register(type: string, converter: ConvertFn) {
    if (converter.length !== 1) {
      throw new PixiInvalidConverterException('Expected converter function to accept 1 argument, ' +
                                              `but found ${converter.length}.`);
    }
    this.converters[type] = converter;
  }

  /**
   * Creates a display object from the given asset and resolves it.
   *
   * @param {Asset} asset The asset to create the display object for.
   * @returns {Promise<DisplayObject>} Resolves the created display object.
   */
  get(asset: Asset): Promise<DisplayObject> {
    let fn = this.converters[asset.type];
    if (!fn)
      return Promise.reject(new PixiAssetNotSupportedException(`Asset of type '${asset.type}' is not supported`));
    return fn(asset);
  }

}
