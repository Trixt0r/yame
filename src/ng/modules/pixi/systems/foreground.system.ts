import { System } from '@trixt0r/ecs';
import { Container } from 'pixi.js';
import { PixiRendererService } from '../services/renderer.service';

export class PixiForegroundSystem extends System {
  private foreground: Container;

  constructor(protected service: PixiRendererService, priority?: number) {
    super(priority);
    this.foreground = new Container();
    this.foreground.name = 'foreground';
    this.foreground.sortableChildren = true;
    this.service.init$.subscribe(() => {
      this.service.app?.stage.addChild(this.foreground);
    });
  }

  /**
   * @inheritdoc
   */
  process(): void {
    this.service.renderer?.render(this.foreground, { clear: false });
  }
}
