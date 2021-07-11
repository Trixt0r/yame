import { SceneComponent } from 'common/scene/component';
import { PlatformPath } from 'path';
import { registerIO } from '../component.io';

const path = (global as any).require('path') as PlatformPath;

export interface AssetSceneComponent extends SceneComponent {
  /**
   * The asset id.
   */
  asset?: string | null;

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
    allowedTypes: [],
  };
}

registerIO({
  type: 'asset',

  async serialize(comp: AssetSceneComponent, _entity, ctx) {
    if (ctx.uri)
      return {
        asset:
          './' +
          path
            .relative(path.dirname(ctx.uri as string), (comp.asset as string).replace(ctx.protocol as string, ''))
            .replace(/\\/g, '/'),
      } as any;
    else return null;
  },

  async deserialize(comp: Partial<AssetSceneComponent>, entity, ctx) {
    if (ctx.uri)
      return {
        asset:
          ctx.protocol +
          path.resolve(path.dirname(ctx.uri as string), (comp.asset as string).replace(ctx.protocol as string, '')),
      } as any;
    else return null;
  },
});
