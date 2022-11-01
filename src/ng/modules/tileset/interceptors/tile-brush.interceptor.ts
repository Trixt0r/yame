import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { IPoint } from 'common/math';
import { PointSceneComponent, RangeSceneComponent, SceneComponent, SceneEntity, SceneEntityType } from 'common/scene';
import { AddToolService } from 'ng/modules/asset';
import { PixiRendererService } from 'ng/modules/pixi/services/renderer.service';
import { EngineService, Isolate, SceneService } from 'ng/modules/scene';
import { ToolEvent, ToolHandler, ToolInterceptor, ToolResult } from 'ng/modules/toolbar';
import { SelectionToolService } from 'ng/modules/toolbar/tools/selection';

@Injectable()
export class TileBrushInterceptor extends ToolInterceptor<MouseEvent, AddToolService> {
  private placements: IPoint[] = [];
  private entity: SceneEntity | null = null;

  constructor(private scene: SceneService, private selection: SelectionToolService, private engine: EngineService, protected store: Store) {
    super();
  }

  private getEntityPoint(point: IPoint, grid: IPoint): IPoint {
    const renderer = this.scene.renderer as PixiRendererService;
    const target = renderer.getContainer(this.entity!.id)!;
    const p = target!.toLocal(point, renderer.scene);
    p.x = typeof grid?.x === 'number' ? Math.round(p.x / grid.x) * grid.x : p.x;
    p.y = typeof grid?.y === 'number' ? Math.round(p.y / grid.y) * grid.y : p.y;
    return p;
  }

  private pushPlacement(point: IPoint, grid: IPoint): void {
    const { x, y } = this.getEntityPoint(point, grid);
    this.placements.push({ x, y });
  }

  /**
   * @inheritdoc
   */
  intercept<R>(event: ToolEvent<MouseEvent, AddToolService>, next: ToolHandler<MouseEvent, AddToolService>): ToolResult<R> {
    const { origin, tool } = event;
    const grid = tool.grid;

    if (origin.type !== 'mousemove' || !grid || !tool.mousePressed) {
      if (origin.type === 'mouseup' && tool.grid) {
        if (tool.mousePressed) {
          this.entity!._components.add({ id: 'tileset.update-pivot', type: 'tileset' });
          const entity = this.entity;
          this.engine.run();
          requestAnimationFrame(() => this.store.dispatch(new Isolate(entity)));
        }
        this.placements = [];
        this.entity = null;
        if (tool.mousePressed) {
          tool.mousePressed = false;
          return;
        }
      }

      if (origin.type === 'mousedown') this.placements = [];

      if (origin.type === 'mousemove') {
        const isolated = this.store.snapshot().select.isolated as SceneEntity;
        if (isolated && isolated.type === SceneEntityType.Object) {
          this.entity = isolated;

          const preview = (this.engine.engine.entities.elements as SceneEntity[]).find(_ => !!_.components.byId('preview'))!;
          const entityScale = this.entity.components.byId('transformation.scale') as PointSceneComponent;
          const entitySkew = this.entity.components.byId('transformation.skew') as PointSceneComponent;
          const entityRotation = this.entity.components.byId('transformation.rotation') as RangeSceneComponent;

          const scale = preview.components.byId('transformation.scale') as PointSceneComponent;
          const skew = preview.components.byId('transformation.skew') as PointSceneComponent;
          const rotation = preview.components.byId('transformation.rotation') as RangeSceneComponent;

          scale.x = entityScale.x;
          scale.y = entityScale.y;
          skew.x = entitySkew.x;
          skew.y = entitySkew.y;
          rotation.value = entityRotation.value;

          const { x, y } = this.scene.renderer.projectToScene(origin.offsetX, origin.offsetY);
          const mapped = this.getEntityPoint({ x, y }, grid!);
          const renderer = this.scene.renderer as PixiRendererService;
          const back = renderer.scene.toLocal(mapped, renderer.getContainer(this.entity!.id));
          this.scene.updatePreview(back.x ?? x, back.y ?? y);
          this.entity = null;
          return;
        }
      }

      return next(event);
    }
    const isolated = this.store.snapshot().select.isolated as SceneEntity;
    if (!this.entity && isolated && isolated.type === SceneEntityType.Object) {
      this.entity = isolated;
      this.entity.components.remove(this.entity.components.byId('tileset.locked')!);
      const comp = isolated?.components.byId('tileset.positions') as SceneComponent & { values: IPoint[] };
      this.placements = comp?.values ?? [];
    }

    tool.updateMouse(origin);
    tool.createPreview();
    const { x, y } = tool.getPoint(origin);
    const mapped = this.entity ? this.getEntityPoint({ x, y }, grid) : { x, y };

    const found = !!this.entity && this.placements.find(_ => _.x === mapped.x && _.y === mapped.y);
    if (!found) {
      if (!this.entity) {
        tool.addEntity({ x, y }).subscribe(_ => {
          this.entity = _;
          const comp = this.entity?.components.byId('tileset.positions') as SceneComponent & { values: IPoint[] };
          this.pushPlacement({ x, y }, grid);
          comp.values = this.placements;
        });
      } else {
        this.pushPlacement({ x, y }, grid);
      }
    } else {
      this.selection.mousemove(origin);
    }

    const renderer = this.scene.renderer as PixiRendererService;
    const back = renderer.scene.toLocal(mapped, renderer.getContainer(this.entity!.id));

    this.scene.updatePreview(back.x ?? x, back.y ?? y);
  }
}
