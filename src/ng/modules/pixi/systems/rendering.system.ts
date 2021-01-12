import { Collection, System } from '@trixt0r/ecs';
import { PixiRendererService } from '../services/renderer.service';
import { SceneEntity } from 'common/scene';

export class PixiRenderingSystem extends System {

  constructor(private service: PixiRendererService, priority?: number) {
    super(priority);
  }

  /**
   * @inheritdoc
   */
  process(): void {
    (this.engine?.entities as Collection<SceneEntity>).forEach((entity: SceneEntity) => {
      const container = this.service.getContainer(entity.id);
      if (!container) return;
      container.visible = entity.components.getValue('visible', 'bool', true) as boolean;
      if (!entity.components.byId('transform-off'))
        container.zIndex = entity.components.getValue('index', 'index', 1) as number;
    });
    this.service.diagnostics.startRenderingTime = performance.now();
    this.service.renderer?.render(this.service.scene);
    this.service.diagnostics.endRenderingTime = performance.now();
  }
}
