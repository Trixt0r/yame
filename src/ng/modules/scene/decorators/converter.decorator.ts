import { Injector } from '@angular/core';
import { Type } from 'common/type';
import { ISceneAssetConverter, SceneAssetConverterService } from '../services/converter.service';

/**
 * Key under which converter metadata is stored.
 */
export const META_CONVERTER_KEY = '__converterMeta';

/**
 * Describes metadata being added to decorated converter classes.
 */
interface ConverterMetadata {
  /**
   * Methods registered for being called when converting certain asset types.
   */
  methods: { [name: string]: string[] }
}

/**
 * Definition for a converter class with metadata.
 */
export interface ConverterClass extends Type {
  /**
   * Metadata for a converter.
   */
  [META_CONVERTER_KEY]: ConverterMetadata;
}

/**
 * An internal list of all converter classes.
 */
const classes: ConverterClass[] = [];

/**
 * Makes sure default converter metadata is set on the given target class.
 *
 * @param target The target class.
 * @returns The input target, for chaining.
 */
function ensureDefaultMetaData(target: any): ConverterClass {
  if (!target[META_CONVERTER_KEY]) {
    const meta: ConverterMetadata = {
      methods: { }
    };
    Object.defineProperty(target, META_CONVERTER_KEY, { value: meta });
    classes.push(target);
  }
  return target;
}

/**
 * Registers the acutal converter class instances retrieved by the given injector.
 * Needs to be called during angular initialization.
 *
 * @param injector The injector instance of the current module.
 */
export function decorateConverterInstances(injector: Injector): void {
  classes.forEach(converterType => {
    const instance = injector.get(converterType) as any;
    const methods = converterType[META_CONVERTER_KEY].methods;
    Object.keys(methods).forEach(method => {
      const types = methods[method];
      types.forEach(type => {
        const converter: ISceneAssetConverter = {
          execute(asset) {
            return instance[method].call(instance, asset);
          }
        };
        SceneAssetConverterService.register(type, converter)
      });
    });
  });
}

/**
 * Decorates a method for being called as a converter function for the given types.
 * Make sure the class containing the method is `Injectable`.
 *
 * @param type The type(s) for which the asset converter will be used.
 */
export function Convert(...types: string[]): Function {
  return function decorator(target: any, propertyKey: string): void {
    ensureDefaultMetaData(target.constructor)
      [META_CONVERTER_KEY].methods[propertyKey] = types;
  };
}