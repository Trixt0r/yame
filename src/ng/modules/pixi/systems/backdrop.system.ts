import { Container, filters, Graphics, Point } from 'pixi.js';
import { PixiRendererService } from '../services/renderer.service';
import { System } from '@trixt0r/ecs';
import { Select } from '@ngxs/store';
import { transformTo } from '../utils/transform.utils';
import { maxBy } from 'lodash';
import { SceneEntity } from 'common/scene';
import { Observable } from 'rxjs';
import { ISelectState } from 'ng/modules/scene';

export class PixiBackdropSystem extends System {

  protected container = new Container();
  protected graphics = new Graphics();
  protected blur = new filters.BlurFilter(5);

  protected topLeft = new Point();
  protected bottomRight = new Point();

  protected isolated?: SceneEntity | null;

  protected transformOff = { id: 'transform-off', type: 'selection-container' };

  @Select((state: { select: ISelectState }) => state.select.isolated) isolated$!: Observable<SceneEntity>;

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
                    if (actionId !== currentId) this.unlock();
                    if (isolated) this.lock(isolated)
                    else this.scene.removeChild(this.container);
                    this.isolated = isolated;
                    this.active = !!isolated;
                    service.engineService.engine.run();
                  });
  }

  /**
   * Locks the given entity, i.e. puts all children of the given entity into foreground.
   *
   * @param entity The entity to lock.
   */
  lock(entity: SceneEntity): void {
    const isolated = entity;
    const service = this.service;
    this.active = true;
    service.scene.addChild(this.container);
    this.container.transform.updateTransform(this.scene.transform);

    // Move the isolated container to the front
    const container = service.getContainer(isolated.id);
    if (container && container.parent !== this.scene) {
      container.transform.updateTransform(container.parent.transform);
      this.scene.addChild(container);
      transformTo(container, this.scene);
      service.updateComponents(isolated.components, container);
      let parentEntity = service.sceneService.getEntity(isolated.parent);
      while (parentEntity) {
        const container = service.getContainer(parentEntity.id);
        if (container) service.updateComponents(parentEntity.components, container);
        parentEntity = service.sceneService.getEntity(parentEntity.parent);
      }
    }

    // Move inactive entities to the backdrop
    const children = service.sceneService.getChildren(isolated, true);
    service.sceneService.entities.forEach(it => {
      if (it.id === isolated.id || children.indexOf(it) >= 0 || it.parent) return;
      const child = service.getContainer(it.id);
      if (!child) return;
      child.transform.updateTransform(child.parent.transform);
      this.container.addChild(child);
      transformTo(child, this.container);
      it.components.add(this.transformOff);
      service.updateComponents(it.components, child);
    });
    if (this.container.children.length > 0)
      this.graphics.zIndex = (maxBy(this.container.children, it => it.zIndex)?.zIndex || 0) + 1;
    service.engineService.engine.run();
  }

  /**
   * Unlocks the currently locked entity.
   */
  unlock(): void {
    const service = this.service;
    this.active = true;

    // Move backdrop entities back
    (this.container.children as Container[]).slice().forEach((child: Container) => {
      if (!child.name) return;
      const entity = service.sceneService.getEntity(child.name);
      if (!entity) return;
      child.transform.updateTransform(child.parent.transform);
      const parent = service.getContainer(entity.parent) || this.scene;
      parent.addChild(child);
      transformTo(child, parent);
      service.updateComponents(entity.components, child);
      entity.components.remove(this.transformOff);
    });
    this.scene.updateTransform();

    // Move isolated entity back to original position
    if (this.isolated) {
      const child = service.getContainer(this.isolated.id);
      if (child) {
        child.transform.updateTransform(child.parent.transform);
        const parent = service.getContainer(this.isolated.parent) || this.scene;
        parent.addChild(child);
        transformTo(child, parent);
        let parentEntity = this.isolated;
        while (parentEntity) {
          const container = service.getContainer(parentEntity.id);
          if (container) service.updateComponents(parentEntity.components, container);
          parentEntity = service.sceneService.getEntity(parentEntity.parent) as SceneEntity;
        }
      }
    }
    service.engineService.engine.run();
  }

  /**
   * @inheritdoc
   */
  process(): void {
    this.graphics.clear();
    this.graphics.beginFill(0x000000, 0.5);
    this.topLeft.set(0, 0);
    this.bottomRight.set(this.service.renderer?.width, this.service.renderer?.height);
    this.container.toLocal(this.topLeft, void 0, this.topLeft);
    this.container.toLocal(this.bottomRight, void 0, this.bottomRight);
    this.graphics.drawRect(this.topLeft.x, this.topLeft.y, this.bottomRight.x - this.topLeft.x, this.bottomRight.y - this.topLeft.y);
    this.graphics.endFill();
  }

}
