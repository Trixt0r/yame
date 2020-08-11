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

    if (position) container.position.copyFrom(position);
    if (scale) container.scale.copyFrom(scale);
    if (skew) container.skew.copyFrom(skew);
    if (pivot) container.pivot.copyFrom(pivot);
    container.rotation = rotation.value;
  }
}
