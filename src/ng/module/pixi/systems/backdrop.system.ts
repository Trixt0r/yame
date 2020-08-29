import { Container, filters, Graphics, Point } from 'pixi.js';
import { PixiRendererService } from '../services/renderer.service';
import { System } from '@trixt0r/ecs';
import { Select } from '@ngxs/store';
import { transformTo } from '../utils/transform.utils';
import { maxBy } from 'lodash';
import { SceneEntity } from 'common/scene';
import { tweenFunctions } from 'common/tween';
import { Observable } from 'rxjs';

export class PixiBackdropSystem extends System {

  protected container = new Container();
  protected graphics = new Graphics();
  protected blur = new filters.BlurFilter(0);
  protected alpha = 0;
  protected tween = 0;
  protected tweenDuration = 5;
  protected tweenDirection = 1;

  protected topLeft = new Point();
  protected bottomRight = new Point();
  protected intervalId: number = null;

  protected isolated: SceneEntity;

  protected transformOff = { id: 'transform-off', type: 'selection-container' };

  @Select(state => state.select.isolated) isolated$: Observable<SceneEntity>;

  get scene(): Container {
    return this.service.scene;
  }

  constructor(protected service: PixiRendererService, priority?: number) {
    super(priority);
    this.container.zIndex = -100;
    this.container.sortableChildren = true;
    this.container.filters = [this.blur];
    this.container.addChild(this.graphics);
    this.active = false;
    this.isolated$.subscribe(async isolated => {
                    const actionId = isolated ? isolated.id : null;
                    const currentId = this.isolated ? this.isolated.id : null;
                    if (actionId !== currentId) await this.unlock();
                    if (isolated) await this.lock(isolated)
                    else this.scene.removeChild(this.container);
                    this.isolated = isolated;
                    this.active = !!isolated;
                    service.engineService.engine.run();
                  });
  }

  clearInterval() {
    if (!this.intervalId) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  async lock(entity: SceneEntity): Promise<void> {
    this.tween = 0;
    this.tweenDirection = 1;
    const isolated = entity;
    const service = this.service;
    this.active = true;
    service.scene.addChild(this.container);
    this.container.transform.updateTransform(this.scene.transform);
    const container = service.getContainer(isolated.id);
    if (container.parent !== this.scene) {
      container.transform.updateTransform(container.parent.transform);
      this.scene.addChild(container);
      transformTo(container, this.scene);
      service.updateComponents(isolated.components, container);
    }

    const children = service.sceneService.getChildren(isolated, true);
    service.sceneService.entities.forEach(it => {
      if (it.id === isolated.id || children.indexOf(it) >= 0 || it.parent) return;
      const child = service.getContainer(it.id);
      if (!child) return;
      child.transform.updateTransform(child.parent.transform);
      this.container.addChild(child);
      transformTo(child, this.container);
      it.components.add(this.transformOff);
    });
    if (this.container.children.length > 0)
      this.graphics.zIndex = maxBy(this.container.children, it => it.zIndex).zIndex + 1;
    return new Promise(resolve => {
      this.clearInterval();
      this.intervalId = window.setInterval(() => {
        service.engineService.engine.run();
        if (this.tween < this.tweenDuration) return;
        this.clearInterval();
        resolve();
      }, 16.66667);
    });
  }

  async unlock(): Promise<void> {
    this.tween = this.tweenDuration;
    this.tweenDirection = -1;
    const service = this.service;
    this.active = true;

    this.container.children.slice().forEach(child => {
      if (!child.name) return;
      const entity = service.sceneService.getEntity(child.name);
      if (!entity) return;
      child.transform.updateTransform(child.parent.transform);
      const parent = service.getContainer(entity.parent) || this.scene;
      parent.addChild(child);
      transformTo(child, parent);
      entity.components.remove(this.transformOff);
    });
    this.scene.updateTransform();

    if (this.isolated) {
      const child = service.getContainer(this.isolated.id);
      child.transform.updateTransform(child.parent.transform);
      const parent = service.getContainer(this.isolated.parent) || this.scene;
      parent.addChild(child);
      transformTo(child, parent);
      this.service.updateComponents(this.isolated.components, child);
      this.isolated.components.remove(this.transformOff);
    }

    return new Promise(resolve => {
      this.clearInterval();
      this.intervalId = window.setInterval(() => {
        service.engineService.engine.run();
        if (this.tween > 0) return
        this.clearInterval();
        resolve();
      }, 16.66667);
    });
  }

  onDeactivated() {
    this.clearInterval();
  }

  /**
   * @inheritdoc
   */
  process(): void {
    this.tween = Math.max(0, Math.min(this.tween + this.tweenDirection, this.tweenDuration));
    this.blur.blur = tweenFunctions.linear(this.tween, 0, 7, this.tweenDuration);
    this.graphics.clear();
    this.graphics.beginFill(0x000000, tweenFunctions.linear(this.tween, 0, 0.5, this.tweenDuration));
    this.topLeft.set(0, 0);
    this.bottomRight.set(this.service.renderer.width, this.service.renderer.height);
    this.container.toLocal(this.topLeft, null, this.topLeft);
    this.container.toLocal(this.bottomRight, null, this.bottomRight);
    this.graphics.drawRect(this.topLeft.x, this.topLeft.y, this.bottomRight.x - this.topLeft.x, this.bottomRight.y - this.topLeft.y);
    this.graphics.endFill();
  }

}
