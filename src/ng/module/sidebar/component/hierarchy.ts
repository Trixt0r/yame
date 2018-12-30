import { Component } from '@angular/core';
import { Entity, EntityData } from 'ng/module/pixi/scene/entity';
import { NodeData } from '../service/hierarchy';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material';
import { Store, Select } from '@ngxs/store';
import { ISceneState } from 'ng/module/pixi/ngxs/state';
import { Observable } from 'rxjs/Observable';
import { DeleteEntity, UpdateEntity } from 'ng/module/pixi/ngxs/actions';

@Component({
  moduleId: module.id.toString(),
  selector: 'yame-hierarchy',
  templateUrl: 'hierarchy.html',
  styleUrls: ['./hierarchy.scss'],
})
export class HierarchyComponent {
  nestedTreeControl: NestedTreeControl<NodeData>;
  nestedDataSource: MatTreeNestedDataSource<NodeData>;
  title = 'Hierarchy';

  @Select() scene$: Observable<ISceneState>;

  constructor(private store: Store) {
    this.nestedTreeControl = new NestedTreeControl<NodeData>(() => []);
    this.nestedDataSource = new MatTreeNestedDataSource();
    this.nestedDataSource.data = [];
    this.scene$.subscribe(data => {
      console.log(data);
      this.nestedDataSource.data = null;
      this.nestedDataSource.data = <any>data.entities;
    });
  }

  hasNestedChild = (_: number, nodeData: NodeData) => nodeData.entities;

  toggleLock(node: EntityData) {
    const message = node.locked ? 'unlock' : 'lock';
    const data = Object.assign({}, node, { id: node.id, locked: !node.locked });
    this.store.dispatch(new UpdateEntity(data, message));
  }

  toggleVisibility(node: EntityData) {
    const message = node.visibility ? 'hide' : 'show';
    const data = Object.assign({}, node, { id: node.id, visibility: !node.visibility });
    this.store.dispatch(new UpdateEntity(data, message));
  }

  removeEntity(node) {
    this.store.dispatch(new DeleteEntity(node.id));
  }

  isChanged(node: Entity) {
    return node.locked || !node.visibility;
  }
}
