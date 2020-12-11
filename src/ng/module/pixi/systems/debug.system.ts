import { System } from '@trixt0r/ecs';
import { Container, Text } from 'pixi.js';
import { PixiRendererService } from '../services/renderer.service';

export class PixiDebugSystem extends System {

  private debugDisplay: Container;
  private debugDuration?: Text;

  constructor(protected service: PixiRendererService, priority?: number) {
    super(priority);
    this.debugDisplay = new Container();
    this.debugDisplay.name = 'debug';
    this.debugDisplay.position.set(76, 8);
    this.service.init$.subscribe(() => {
      this.service.stage?.addChild(this.debugDisplay);
      this.debugDuration = new Text('0ms', { fill: 0xffffff, fontSize: 12, fontFamily: 'Courier New' });
      this.debugDuration.name = 'duration';
      this.debugDisplay.addChild(this.debugDuration);
      this.process();
    });
  }

  /**
   * @inheritdoc
   */
  process(): void {
    if (!this.debugDuration) return;
    const now = performance.now();
    const diagnostics = this.service.diagnostics;
    const time = this.service.diagnostics.startTime as number;
    const overAllTime = now - time;
    const renderingTime = (diagnostics.endRenderingTime as number) - (diagnostics.startRenderingTime as number);
    const iterationTime = overAllTime - renderingTime;
    this.debugDuration.text = `Entities: ${diagnostics.entities || 0}
Iteration: ${iterationTime || 0} ms
Rendering: ${renderingTime || 0} ms
Overall: ${overAllTime || 0} ms`;
    this.service.renderer?.render(this.debugDisplay, void 0, false);
  }

}
