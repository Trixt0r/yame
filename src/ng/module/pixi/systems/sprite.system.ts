import { AbstractEntitySystem } from '@trixt0r/ecs';
import { SceneEntity, AssetSceneComponent, ColorSceneComponent } from 'common/scene';
import { PixiRendererService } from '../services/renderer.service';
import { Sprite, utils, Texture } from 'pixi.js';
import { tweenFunctions } from 'common/tween';

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

  constructor(private service: PixiRendererService, priority?: number) {
    super(priority, [{ id: 'sprite.texture' }, { id: 'sprite.color' }]);
  }

  protected tween(start: number, end: number, t: number, duration: number, type = PixiSpriteSystem.settings.type): number {
    const fn = tweenFunctions[type];
    if (!fn) return end;
    else return fn(t, start, end, duration);
  }

  protected animate(sprite: Sprite): void {
    sprite.scale.set(0, 0);
    let t = 0;
    const duration = PixiSpriteSystem.settings.duration;
    const step = duration / PixiSpriteSystem.settings.fps;
    const interval = setInterval(() => {
      t = Math.min(duration, t + step);
      sprite.scale.x = this.tween(0, 1, t, duration);
      sprite.scale.y = this.tween(0, 1, t, duration);
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
    if (!sprite) {
      const tex = Texture.from(spriteTexture.asset);
      sprite = new Sprite(tex);
      sprite.name = 'sprite';
      sprite.anchor.set(0.5, 0.5);
      const animate = entity.components.byId('sprite.animate');
      if (!tex.baseTexture.valid) {
        tex.baseTexture.on('update', () => {
          this.service.engineService.run();
          if (animate && animate.boolean === true) this.animate(sprite);
        });
      } else {
        if (animate && animate.boolean === true) this.animate(sprite);
      }
      container.addChild(sprite);
    }
    const spriteColor = entity.components.byId('sprite.color') as ColorSceneComponent;
    sprite.tint = utils.rgb2hex([spriteColor.red / 255, spriteColor.green / 255, spriteColor.blue / 255]);
    sprite.alpha = spriteColor.alpha;
  }
}
