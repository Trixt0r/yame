import { Injectable } from '@angular/core';
import { Entity } from 'ng/module/pixi/scene/entity';
import { Group } from 'ng/module/pixi/scene/group';

export interface NodeData {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  entities?: NodeData[];
}

@Injectable()
export class HierarchyService {

  getNodeData<T extends Entity>(entity: Entity | Group<T>): NodeData {
    return {
      id: entity.id,
      name: entity.name,
      locked: entity.locked,
      visible: entity.visibility,
      entities: entity instanceof Group ? entity.map(this.getNodeData, this) : void 0,
    };
  }
}
