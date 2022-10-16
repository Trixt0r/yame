import { Injectable } from '@angular/core';
import { IPoint } from 'common/math';
import { SceneComponent, SceneEntity } from 'common/scene';
import { AddToolService } from 'ng/modules/asset';
import { PixiRendererService } from 'ng/modules/pixi/services/renderer.service';
import { SceneService } from 'ng/modules/scene';
import { ToolEvent, ToolHandler, ToolInterceptor, ToolResult } from 'ng/modules/toolbar';
import { SelectionToolService } from 'ng/modules/toolbar/tools/selection';

@Injectable()
export class TileBrushInterceptor extends ToolInterceptor<MouseEvent, AddToolService> {
  private placements: IPoint[] = [];
  private entity: SceneEntity | null = null;

  constructor(private scene: SceneService, private selection: SelectionToolService) {
    super();
  }

  private getEntityPoint(point: IPoint): IPoint {
    const renderer = this.scene.renderer as PixiRendererService;
    return renderer.getContainer(this.entity!.id)!.toLocal(point, renderer.scene);
  }

  private pushPlacement(point: IPoint): void {
    this.placements.push(this.getEntityPoint(point));
  }

  /**
   * @inheritdoc
   */
  intercept<R>(
    event: ToolEvent<MouseEvent, AddToolService>,
    next: ToolHandler<MouseEvent, AddToolService>
  ): ToolResult<R> {
    const { origin, tool } = event;

    if (origin.type !== 'mousemove' || !tool.grid || !tool.mousePressed) {
      if (origin.type === 'mouseup' && tool.grid) {
        if (tool.mousePressed) {
          // this.entity?._components.add({ id: 'tileset.locked', type: 'tileset' });
          this.entity?._components.add({ id: 'tileset.update-pivot', type: 'tileset' });
        }
        this.placements = [];
        this.entity = null;
        if (tool.mousePressed) {
          tool.mousePressed = false;
          return;
        }
      }

      if (origin.type === 'mousedown') this.placements = [];
      return next(event);
    }

    tool.updateMouse(origin);
    tool.createPreview();
    const { x, y } = tool.getPoint(origin);
    const mapped = this.entity ? this.getEntityPoint({ x, y }) : { x, y };

    const found = !!this.entity && this.placements.find(_ => _.x === mapped.x && _.y === mapped.y);
    if (!found) {
      if (!this.entity) {
        tool.addEntity({ x, y }).subscribe(_ => {
          this.entity = _;
          const comp = this.entity?.components.byId('tileset.positions') as SceneComponent & { values: IPoint[] };
          this.pushPlacement({ x, y });
          comp.values = this.placements;
        });
      } else {
        this.pushPlacement({ x, y });
      }
    } else {
      this.selection.mousemove(origin);
    }

    this.scene.updatePreview(x, y);
  }
}
