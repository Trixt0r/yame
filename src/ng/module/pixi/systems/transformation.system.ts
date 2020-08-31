import { AbstractEntitySystem } from '@trixt0r/ecs';
import { PixiRendererService } from '../services/renderer.service';
import { SceneEntity, PointSceneComponent, RangeSceneComponent } from 'common/scene';
import { SizeSceneComponent } from 'common/scene/component/size';

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
    const size = entity.components.byId('transformation.size') as SizeSceneComponent;
    const skew = entity.components.byId('transformation.skew') as PointSceneComponent;
    const pivot = entity.components.byId('transformation.pivot') as PointSceneComponent;
    const rotation = entity.components.byId('transformation.rotation') as RangeSceneComponent;

    if (position) container.position.copyFrom(position);
    if (size) {
      container.width = size.width;
      container.height = size.height;
    }
    if (skew) container.skew.copyFrom(skew);
    if (pivot) container.pivot.copyFrom(pivot);
    if (rotation) container.rotation = rotation.value;
  }
}
