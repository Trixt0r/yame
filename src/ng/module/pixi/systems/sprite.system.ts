import { AbstractEntitySystem } from '@trixt0r/ecs';
import { SceneEntity, AssetSceneComponent, ColorSceneComponent } from 'common/scene';
import { PixiRendererService } from '../services/renderer.service';
import { Sprite, utils, Texture } from 'pixi.js';
import { tweenFunctions } from 'common/tween';
import { SizeSceneComponent } from 'common/scene/component/size';

interface TweenSettings {
  fps: number;
  duration: number;
  type: string;
}

export class PixiSpriteSystem extends AbstractEntitySystem<SceneEntity> {

  static settings: TweenSettings = {
    fps: 60,
    duration: 250,
    type: 'easeOutBounce',
  };

  rgbArray: number[] = [0, 0, 0];

  constructor(private service: PixiRendererService, priority?: number) {
    super(priority, [{ id: 'sprite.texture' }, { id: 'sprite.color' }]);
  }

  protected tween(start: number, end: number, t: number, duration: number, type = PixiSpriteSystem.settings.type): number {
    const fn = tweenFunctions[type];
    if (!fn) return end;
    else return fn(t, start, end, duration);
  }

  protected animate(entity: SceneEntity): void {
    let size = entity.components.byId('transformation.size') as SizeSceneComponent;
    if (!size) size = entity.components.byId('transformation.size.tmp') as SizeSceneComponent;
    const container = this.service.getContainer(entity.id);
    container.width = 0;
    container.height = 0;
    size.width = 0;
    size.height = 0;
    const sprite = container.getChildByName('sprite') as Sprite
    const targetWidth = sprite.width;
    const targetHeight = sprite.height;
    let t = 0;
    const duration = PixiSpriteSystem.settings.duration;
    const step = duration / PixiSpriteSystem.settings.fps;
    const interval = setInterval(() => {
      t = Math.min(duration, t + step);
      size.width = this.tween(0, targetWidth, t, duration);
      size.height = this.tween(0, targetHeight, t, duration);
      if (t === duration) clearInterval(interval);
      this.service.engineService.run();
    }, step);
  }

  /**
   * @inheritdoc
   */
  processEntity(entity: SceneEntity) {
    const container = this.service.getContainer(entity.id);
    const spriteTexture = entity.components.byId('sprite.texture') as AssetSceneComponent;
    let sprite = container.getChildByName('sprite') as Sprite;
    if (sprite && sprite.texture.baseTexture.cacheId !== spriteTexture.asset) {
      container.removeChild(sprite);
      sprite = null;
    }
    if (spriteTexture.asset && !sprite) {
      const tex = Texture.from(spriteTexture.asset);
      sprite = new Sprite(tex);
      sprite.name = 'sprite';
      sprite.anchor.set(0.5, 0.5);
      container.addChild(sprite);
      const animate = entity.components.byId('sprite.animate');
      if (!tex.baseTexture.valid) {
        tex.baseTexture.on('update', () => {
          this.service.engineService.run({ textureLoaded: true });
          if (animate && animate.boolean === true) this.animate(entity);
        });
      } else {
        if (animate && animate.boolean === true) this.animate(entity);
      }
    }
    if (sprite) {
      const spriteColor = entity.components.byId('sprite.color') as ColorSceneComponent;
      this.rgbArray[0] = spriteColor.red / 255;
      this.rgbArray[1] = spriteColor.green / 255;
      this.rgbArray[2] = spriteColor.blue / 255;
      sprite.tint = utils.rgb2hex(this.rgbArray);
      sprite.alpha = spriteColor.alpha;
    }
  }
}
