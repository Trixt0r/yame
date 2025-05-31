import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { IPoint } from 'common/math';
import {
  createTransformationComponents,
  PointSceneComponent,
  RangeSceneComponent,
  SceneComponent,
  SceneEntity,
  SceneEntityType,
} from 'common/scene';
import { SizeSceneComponent } from 'common/scene/component/size';
import { maxBy, minBy } from 'lodash';
import { AddToolService } from 'ng/modules/asset';
import { PixiRendererService } from 'ng/modules/pixi/services/renderer.service';
import { EngineService, Isolate, SceneService } from 'ng/modules/scene';
import { ToolEvent, ToolHandler, ToolInterceptor, ToolResult } from 'ng/modules/toolbar';
import { SelectionToolService } from 'ng/modules/toolbar/tools/selection';
import { ITilesetSetting } from '../interfaces';
import { SETTING_ID } from '../systems/tileset.system';

/**
 * Interceptor for handling tile brush tool events in the tileset editor.
 *
 * This class manages the placement of tiles using a brush tool, including grid snapping,
 * preview overlays, and updating the scene with new tile entities. It interacts with the
 * scene, selection, and engine services to provide a seamless tile painting experience.
 *
 * - Handles mouse events to place tiles on a grid.
 * - Manages an overlay entity for visual feedback during placement.
 * - Updates tile positions and interacts with the NGXS store for state management.
 * - Supports snapping to grid and previewing tile placement.
 *
 * @extends ToolInterceptor<MouseEvent, AddToolService>
 * @see AddToolService
 * @see SceneService
 * @see SelectionToolService
 * @see EngineService
 */
@Injectable()
export class TileBrushInterceptor extends ToolInterceptor<MouseEvent, AddToolService> {
  private placements: IPoint[] = [];
  private entity: SceneEntity | null = null;
  private overlay: SceneEntity;

  constructor(private scene: SceneService, private selection: SelectionToolService, private engine: EngineService, protected store: Store) {
    super();
    this.overlay = new SceneEntity('tileset.overlay.remove');
    this.overlay.components.add(...createTransformationComponents());
    this.overlay.components.add({
      id: 'tileset.overlay.remove',
      type: 'rect',
      width: 32,
      height: 32,
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ],
    });
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
          this.entity?._components?.add({ id: 'tileset.update-pivot', type: 'tileset' });
          const entity = this.entity;
          this.engine.run();
          requestAnimationFrame(() => this.store.dispatch(new Isolate(entity)));
        }
        this.placements = [];
        this.entity = null;
        this.engine.engine.entities.remove(this.overlay);
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

          // border overlay update
          this.engine.engine.entities.add(this.overlay);
          const { setting } = isolated.components.byId(SETTING_ID) as SceneComponent & { setting: ITilesetSetting };

          const minX = minBy(setting.selections, 'x')?.x ?? 0;
          const minY = minBy(setting.selections, 'y')?.y ?? 0;
          const maxX = maxBy(setting.selections, 'x')?.x ?? 0;
          const maxY = maxBy(setting.selections, 'y')?.y ?? 0;

          const tileWidth = setting.size.x + setting.spacing.x + setting.offset.x;
          const tileHeight = setting.size.y + setting.spacing.y + setting.offset.y;
          const width = (maxX - minX + 1) * tileWidth;
          const height = (maxY - minY + 1) * tileHeight;

          const position = this.overlay.components.byId('transformation.position') as PointSceneComponent;
          position.x = back.x;
          position.y = back.y;

          const overlayComp = this.overlay.components.byId('tileset.overlay.remove') as { points: PointSceneComponent[] } | undefined;

          if (overlayComp) {
            overlayComp.points[0].x = -width / 2;
            overlayComp.points[0].y = -height / 2;

            overlayComp.points[1].x = width / 2;
            overlayComp.points[1].y = -height / 2;

            overlayComp.points[2].x = width / 2;
            overlayComp.points[2].y = height / 2;

            overlayComp.points[3].x = -width / 2;
            overlayComp.points[3].y = height / 2;

            const renderer = this.scene.renderer as PixiRendererService;
            const container = renderer.getContainer(this.overlay.id)!;
            renderer.applyComponents(this.overlay.components, container);

            for (let i = 0; i < 4; i++) {
              overlayComp.points[i].x += mapped.x;
              overlayComp.points[i].y += mapped.y;
              const back = container.toLocal(overlayComp.points[i], renderer.getContainer(this.entity!.id));
              overlayComp.points[i].x = back.x;
              overlayComp.points[i].y = back.y;
            }
          }

          this.entity = null;
          return;
        }
      }

      return next(event);
    }

    const isolated = this.store.snapshot().select.isolated as SceneEntity;
    if (!this.entity && isolated && isolated.type === SceneEntityType.Object) {
      this.entity = isolated;

      const position = this.overlay.components.byId('transformation.position') as PointSceneComponent;
      position.x = 0;
      position.y = 0;
      this.engine.engine.entities.add(this.overlay);

      this.entity.components.remove(this.entity.components.byId('tileset.locked')!);
      const comp = isolated?.components.byId('tileset.positions') as SceneComponent & { values: IPoint[] };
      this.placements = comp?.values ?? [];
    }

    tool.updateMouse(origin);
    tool.createPreview();
    const { x, y } = this.scene.renderer.projectToScene(origin.offsetX, origin.offsetY);
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
