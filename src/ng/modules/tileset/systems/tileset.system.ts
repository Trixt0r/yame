import { Inject, Injectable } from '@angular/core';
import { AbstractEntitySystem } from '@trixt0r/ecs';
import { AssetSceneComponent, createAssetComponent, SceneEntity } from 'common/scene';
import { PixiRendererService } from 'ng/modules/pixi/services/renderer.service';
import { EngineService, SceneComponent, YAME_RENDERER } from 'ng/modules/scene';
import { DisplayObject } from '@pixi/display';
import { ITilesetSetting } from '../interfaces';
import { Tilemap } from '@pixi/tilemap';
import { IPoint } from 'common/math';
import { Texture } from '@pixi/core';

const TILE_MAP_NAME = 'tile-map';
const TEXTURE_ID = 'tileset.texture';
const SETTING_ID = 'tileset.setting';
const POSITIONS_ID = 'tileset.positions';
const LOCKED_ID = 'tileset.locked';
@Injectable({ providedIn: 'root' })
export class TilesetSystem extends AbstractEntitySystem<SceneEntity> {
  constructor(@Inject(YAME_RENDERER) private renderer: PixiRendererService, private engineService: EngineService) {
    super(3, [{ id: TEXTURE_ID }, { id: SETTING_ID }]);
  }

  private updateTiles(
    tileMap: Tilemap,
    tilesetSetting: SceneComponent & { setting: ITilesetSetting },
    tex: Texture,
    container: DisplayObject,
    positions: IPoint[] | null | void
  ): void {
    const width = tilesetSetting.setting.size.x + tilesetSetting.setting.spacing.x + tilesetSetting.setting.offset.x;
    const height = tilesetSetting.setting.size.y + tilesetSetting.setting.spacing.y + tilesetSetting.setting.offset.y;
    const options = {
      tileWidth: tilesetSetting.setting.size.x,
      tileHeight: tilesetSetting.setting.size.y,
      alpha: container.alpha,
    };

    if (!positions?.length) positions = [{ x: 0, y: 0 }];

    tileMap.clear();

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

    tileMap.position.set(0, 0);
    tileMap.pivot.set(0, 0);
    const bounds = tileMap.getLocalBounds();
    tileMap.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);

    positions.forEach(p => {
      tilesetSetting.setting.selections.forEach(({ x, y }) => {
        tileMap.tile(
          tex,
          p.x + tilesetSetting.setting.offset.x + x * tilesetSetting.setting.size.x,
          p.y + tilesetSetting.setting.offset.y + y * tilesetSetting.setting.size.y,
          {
            ...options,
            u: tilesetSetting.setting.offset.x + x * width,
            v: tilesetSetting.setting.offset.y + y * height,
          }
        );
      });
    });
  }

  /**
   * @inheritdoc
   */
  processEntity(entity: SceneEntity): void {
    const container = this.renderer.getContainer(entity.id);
    if (!container) return;
    const tilesetTex = entity.components.byId(TEXTURE_ID) as AssetSceneComponent;
    const tilesetSetting = entity.components.byId(SETTING_ID) as (SceneComponent & { setting: ITilesetSetting }) | undefined;
    if (!tilesetTex || !tilesetSetting) return;

    let tileMap = container.getChildByName(TILE_MAP_NAME) as Tilemap | null;
    let tileMapComp = entity.components.byId('tile-map-asset') as AssetSceneComponent | undefined;
    if (tileMap && tileMapComp?.asset !== tilesetTex.asset) {
      container.removeChild(tileMap);
      if (tileMapComp) entity.components.remove(tileMapComp);
      tileMap = null;
    }

    const tex = Texture.from(tilesetTex.asset!);
    let locked = entity.components.byId(LOCKED_ID);
    let updatePivot: unknown = entity.components.byId('tileset.update-pivot');

    if (!tileMap) {
      tileMapComp = createAssetComponent('tile-map-asset', tilesetTex.asset!);
      tileMapComp.hidden = true;
      entity.components.add(tileMapComp);
      tileMap = new Tilemap([tex.baseTexture]);
      tileMap.name = TILE_MAP_NAME;
      container.addChild(tileMap);
      locked = undefined;
    }

    if (!locked) {
      const positions = (entity.components.byId(POSITIONS_ID) as unknown as SceneComponent & { values: IPoint[] }).values;
      this.updateTiles(tileMap, tilesetSetting, tex, container, positions);
    }

    if (updatePivot) {
      entity.components.remove(entity.components.byId('tileset.update-pivot')!);
      entity.components.add({ id: LOCKED_ID, type: 'tileset' });
    }

    if (!tex.baseTexture.valid) {
      tex.baseTexture.on('update', () => {
        this.engineService.run({ textureLoaded: true });
      });
    }
  }
}
