import { System } from '@trixt0r/ecs';
import { Grid } from '../';
import { PixiRendererService } from '../services/renderer.service';

export class PixiGridSystem extends System {

  protected grid: Grid;

  constructor(protected service: PixiRendererService, priority?: number) {
    super(priority);
    this.grid = new Grid(service.scene);
  }

  /**
   * @inheritdoc
   */
  process(): void {
    this.grid.update(this.service.component.width, this.service.component.height);
    if (!this.grid.isReady) this.grid.once('ready', () => requestAnimationFrame(() => this.service.app.render()));
  }

}
