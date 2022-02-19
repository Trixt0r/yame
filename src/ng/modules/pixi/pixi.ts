import '@pixi/polyfill';
export * from '@pixi/constants';
export * from '@pixi/math';
import '@pixi/math-extras';
export * from '@pixi/runner';
export * from '@pixi/settings';
export * from '@pixi/ticker';
import * as utils from '@pixi/utils';
export { utils };
export * from '@pixi/display';
export * from '@pixi/core';
export * from '@pixi/events';
import * as PIXI from '@pixi/core';
import { install } from '@pixi/unsafe-eval';
install(PIXI);
import '@pixi/mixin-get-child-by-name';
import '@pixi/mixin-get-global-position';
export * from '@pixi/extract';
export * from '@pixi/loaders';
export * from '@pixi/compressed-textures';
export * from '@pixi/basis';
export * from '@pixi/mesh';
export * from '@pixi/particle-container';
export * from '@pixi/sprite';
export * from '@pixi/accessibility';
export * from '@pixi/app';
export * from '@pixi/graphics';
import '@pixi/graphics-extras';
export * from '@pixi/mesh-extras';
import '@pixi/mixin-cache-as-bitmap';
export * from '@pixi/sprite-animated';
export * from '@pixi/sprite-tiling';
export * from '@pixi/spritesheet';
export * from '@pixi/text-bitmap';
export * from '@pixi/text';
// @ts-ignore
export * from '@pixi/interaction';
// export { IHitArea } from '@pixi/interaction';
export * from '@pixi/prepare';

// Renderer plugins
import { Renderer } from '@pixi/core';
import { AccessibilityManager } from '@pixi/accessibility';
Renderer.registerPlugin('accessibility', AccessibilityManager);
import { BatchRenderer } from '@pixi/core';
Renderer.registerPlugin('batch', BatchRenderer);
import { Extract } from '@pixi/extract';
Renderer.registerPlugin('extract', Extract);
import { InteractionManager } from '@pixi/interaction';
Renderer.registerPlugin('interaction', InteractionManager);
import { ParticleRenderer } from '@pixi/particle-container';
Renderer.registerPlugin('particle', ParticleRenderer);
import { Prepare } from '@pixi/prepare';
Renderer.registerPlugin('prepare', Prepare);
import { TilingSpriteRenderer } from '@pixi/sprite-tiling';
Renderer.registerPlugin('tilingSprite', TilingSpriteRenderer);

// Application plugins
import { Application } from '@pixi/app';
import { AppLoaderPlugin } from '@pixi/loaders';
Application.registerPlugin(AppLoaderPlugin);
import { TickerPlugin } from '@pixi/ticker';
Application.registerPlugin(TickerPlugin);

// Loader plugins
import { Loader } from '@pixi/loaders';
import { BasisLoader } from '@pixi/basis';
Loader.registerPlugin(BasisLoader);
import { CompressedTextureLoader, DDSLoader, KTXLoader } from '@pixi/compressed-textures';
Loader.registerPlugin(CompressedTextureLoader);
Loader.registerPlugin(DDSLoader);
Loader.registerPlugin(KTXLoader);
import { SpritesheetLoader } from '@pixi/spritesheet';
Loader.registerPlugin(SpritesheetLoader);
import { BitmapFontLoader } from '@pixi/text-bitmap';
Loader.registerPlugin(BitmapFontLoader);

// Filters
import { BlurFilter, BlurFilterPass } from '@pixi/filter-blur';
export const filters = {
  BlurFilter,
  BlurFilterPass,
};
