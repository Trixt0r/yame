import { AbstractEntitySystem } from '@trixt0r/ecs';
import { PixiRendererService } from '../services/renderer.service';
import { SceneEntity, PointSceneComponent, RangeSceneComponent } from 'common/scene';

export class PixiTransformationSystem extends AbstractEntitySystem<SceneEntity> {

  constructor(private service: PixiRendererService, priority?: number) {
    super(priority, [ { id: 'transformation' } ], [ { id: 'transform-off' } ]);
  }

  /**
   * @inheritdoc
   */
  processEntity(entity: SceneEntity) {
    const container = this.service.getContainer(entity.id);
    const position = entity.components.byId('transformation.position') as PointSceneComponent;
    const scale = entity.components.byId('transformation.scale') as PointSceneComponent;
    const skew = entity.components.byId('transformation.skew') as PointSceneComponent;
    const pivot = entity.components.byId('transformation.pivot') as PointSceneComponent;
    const rotation = entity.components.byId('transformation.rotation') as RangeSceneComponent;
    container.position.set(position.x, position.y);
    container.scale.set(scale.x, scale.y);
    container.skew.set(skew.x, skew.y);
    container.pivot.set(pivot.x, pivot.y);
    container.rotation = rotation.value;
  }
}
