import { Inject, Injectable, Type } from '@angular/core';
import { AbstractEntitySystem } from '@trixt0r/ecs';
import { AssetSceneComponent, createAssetComponent, SceneEntity } from 'common/scene';
import { PixiRendererService } from 'ng/modules/pixi/services/renderer.service';
import { EngineService, SceneComponent, YAME_RENDERER } from 'ng/modules/scene';
import { Container, MIPMAP_MODES, ParticleContainer, Texture, TilingSprite } from 'pixi.js';
import { ITilesetSetting } from '../interfaces';
import { CompositeTilemap, Tilemap } from '@pixi/tilemap';

const TILE_MAP_NAME = 'tile-map';
@Injectable({ providedIn: 'root' })
export class TilesetSystem extends AbstractEntitySystem<SceneEntity> {
  constructor(@Inject(YAME_RENDERER) private renderer: PixiRendererService, private engineService: EngineService) {
    super(3, [{ id: 'tileset.texture' }, { id: 'tileset.setting' }]);
  }

  /**
   * @inheritdoc
   */
  processEntity(entity: SceneEntity): void {
    const container = this.renderer.getContainer(entity.id);
    if (!container) return;
    const tilesetTex = entity.components.byId('tileset.texture') as AssetSceneComponent;
    const tilesetSetting = entity.components.byId('tileset.setting') as
      | (SceneComponent & { setting: ITilesetSetting })
      | undefined;
    if (!tilesetTex || !tilesetSetting) return;

    let tile = container.getChildByName(TILE_MAP_NAME) as TilingSprite | null;
    let tileMapComp = entity.components.byId('tile-map-asset') as AssetSceneComponent | undefined;
    if (tile && tileMapComp?.asset !== tilesetTex.asset) {
      container.removeChild(tile);
      if (tileMapComp) entity.components.remove(tileMapComp);
      tile = null;
    }

    if (tile) return;

    const tex = Texture.from(tilesetTex.asset!);
    tileMapComp = createAssetComponent('tile-map-asset', tilesetTex.asset!);
    tileMapComp.hidden = true;
    entity.components.add(tileMapComp);
    const tileMap = new Tilemap([tex.baseTexture]);
    tileMap.name = TILE_MAP_NAME;

    const width = tilesetSetting.setting.size.x + tilesetSetting.setting.spacing.x + tilesetSetting.setting.offset.x;
    const height = tilesetSetting.setting.size.y + tilesetSetting.setting.spacing.y + tilesetSetting.setting.offset.y;
    const options = {
      tileWidth: tilesetSetting.setting.size.x,
      tileHeight: tilesetSetting.setting.size.y,
      alpha: container.alpha,
    };
    tilesetSetting.setting.selections.forEach(({ x, y }) => {
      tileMap.tile(
        tex,
        tilesetSetting.setting.offset.x + x * tilesetSetting.setting.size.x,
        tilesetSetting.setting.offset.y + y * tilesetSetting.setting.size.y,
        {
          ...options,
          u: tilesetSetting.setting.offset.x + x * width,
          v: tilesetSetting.setting.offset.y + y * height,
        }
      );
    });

    const bounds = tileMap.getLocalBounds();
    tileMap.pivot.x = bounds.x + bounds.width / 2;
    tileMap.pivot.y = bounds.y + bounds.height / 2;
    container.addChild(tileMap);

    if (!tex.baseTexture.valid) {
      tex.baseTexture.on('update', () => {
        this.engineService.run({ textureLoaded: true });
      });
    }
  }

  private render(): void {}
}
