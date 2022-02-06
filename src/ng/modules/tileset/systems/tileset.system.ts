import { Inject, Injectable } from '@angular/core';
import { AbstractEntitySystem } from '@trixt0r/ecs';
import { AssetSceneComponent, SceneEntity } from 'common/scene';
import { PixiRendererService } from 'ng/modules/pixi/services/renderer.service';
import { EngineService, SceneComponent, YAME_RENDERER } from 'ng/modules/scene';
import { Texture, TilingSprite } from 'pixi.js';
import { ITilesetSetting } from '../interfaces';

@Injectable({ providedIn: 'root' })
export class TilesetSystem extends AbstractEntitySystem<SceneEntity> {
  constructor(@Inject(YAME_RENDERER) private renderer: PixiRendererService, private engineService: EngineService) {
    super(3, [{ id: 'tileset.texture' }, { id: 'tileset.setting' }]);
    console.log('here');
  }

  processEntity(entity: SceneEntity): void {
    const container = this.renderer.getContainer(entity.id);
    if (!container) return;
    const tilesetTex = entity.components.byId('tileset.texture') as AssetSceneComponent;
    const tilesetSetting = entity.components.byId('tileset.setting') as
      | (SceneComponent & { setting: ITilesetSetting })
      | undefined;
    if (!tilesetTex || !tilesetSetting) return;

    let tile = container.getChildByName('tile') as TilingSprite | null;
    if (tile && tile.texture.baseTexture.cacheId !== tilesetTex.asset) {
      container.removeChild(tile);
      tile = null;
    }

    if (tile) return;

    const tex = Texture.from(tilesetTex.asset!);
    tile = new TilingSprite(tex, tilesetSetting.setting.size.x, tilesetSetting.setting.size.y);
    tile.tilePosition.set(
      -1 *
        (tilesetSetting.setting.offset.x +
          tilesetSetting.setting.selections[0].x *
            (tilesetSetting.setting.size.x + tilesetSetting.setting.spacing.x + tilesetSetting.setting.offset.x)),
      -1 *
        (tilesetSetting.setting.offset.y +
          tilesetSetting.setting.selections[0].y *
            (tilesetSetting.setting.size.y + tilesetSetting.setting.spacing.y + tilesetSetting.setting.offset.y))
    );
    tile.name = 'tile';
    tile.anchor.set(0.5, 0.5);

    container.addChild(tile);
    if (!tex.baseTexture.valid) {
      tex.baseTexture.on('update', () => {
        this.engineService.run({ textureLoaded: true });
      });
    }
  }
}
