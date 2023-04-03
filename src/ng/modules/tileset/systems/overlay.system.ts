import { Inject, Injectable } from '@angular/core';
import { Graphics } from '@pixi/graphics';
import { AbstractEntitySystem, System } from '@trixt0r/ecs';
import { PointSceneComponent, SceneEntity } from 'common/scene';
import { SizeSceneComponent } from 'common/scene/component/size';
import { PixiRendererService } from 'ng/modules/pixi/services/renderer.service';
import { YAME_RENDERER } from 'ng/modules/scene';

@Injectable({ providedIn: 'root' })
export class TileOverlaySystem extends AbstractEntitySystem<SceneEntity> {
  constructor(@Inject(YAME_RENDERER) private renderer: PixiRendererService) {
    super(4, [{ id: 'tileset.overlay.remove' }]);
  }

  processEntity<U>(
    entity: SceneEntity,
    _index?: number | undefined,
    _entities?: SceneEntity[] | undefined,
    _options?: U | undefined
  ): void {
    const container = this.renderer.getContainer(entity.id);
    if (!container) return;

    const component = entity.components.byId('tileset.overlay.remove') as SizeSceneComponent & { points: PointSceneComponent[] };

    const graphics = (container.getChildByName('tile-overlay') as Graphics) ?? new Graphics();
    graphics.name ??= 'tile-overlay';
    if (!container.getChildByName(graphics.name)) container.addChild(graphics);
    graphics.clear();

    // graphics.beginFill(0xaa1100);
    graphics.lineStyle(2, 0x113399, 1, 1);

    graphics.moveTo(component.points[0].x, component.points[0].y);
    for (let i = 0; i <= 4; i++) graphics.lineTo(component.points[i % 4].x, component.points[i % 4].y);

    // graphics.drawRect(0, 0, component.width, component.height);
    // graphics.endFill();
  }
}
