import { Injectable } from '@angular/core';
import { IPoint } from 'common/math';
import { AddToolService } from 'ng/modules/asset';
import { SceneService } from 'ng/modules/scene';
import { ToolEvent, ToolHandler, ToolInterceptor, ToolResult } from 'ng/modules/toolbar';
import { SelectionToolService } from 'ng/modules/toolbar/tools/selection';

@Injectable()
export class TileBrushInterceptor extends ToolInterceptor<MouseEvent, AddToolService> {
  private placements: IPoint[] = [];

  constructor(private scene: SceneService, private selection: SelectionToolService) {
    super();
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
      if (origin.type === 'mouseup') {
        const { x, y } = tool.getPoint(origin);
        const found = this.placements.find(_ => _.x === x && _.y === y);
        this.placements = [];
        if (tool.mousePressed && tool.grid && found) {
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

    const found = this.placements.find(_ => _.x === x && _.y === y);
    if (!found) {
      this.placements.push({ x, y });
      tool.addEntity({ x, y }).subscribe();
    } else {
      this.selection.mousemove(origin);
    }

    this.scene.updatePreview(x, y);
  }
}
