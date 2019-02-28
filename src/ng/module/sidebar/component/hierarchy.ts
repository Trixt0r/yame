import { Component, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { Entity, EntityData, PropertyOptionsExt } from 'ng/module/pixi/scene/entity';
import { NodeData } from '../service/hierarchy';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource, MatTree } from '@angular/material';
import { Store, Select as StoreSelect } from '@ngxs/store';
import { ISceneState } from 'ng/module/pixi/ngxs/state';
import { Observable } from 'rxjs/Observable';
import { DeleteEntity, UpdateEntity } from 'ng/module/pixi/ngxs/actions';
import { ISelectionState } from 'ng/module/toolbar/tools/selection/ngxs/state';
import { Unselect, Select } from 'ng/module/toolbar/tools/selection/ngxs/actions';

@Component({
  moduleId: module.id.toString(),
  selector: 'yame-hierarchy',
  templateUrl: 'hierarchy.html',
  styleUrls: ['./hierarchy.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HierarchyComponent implements AfterViewInit {
  nestedTreeControl: NestedTreeControl<NodeData>;
  nestedDataSource: MatTreeNestedDataSource<NodeData>;
  title = 'Hierarchy';

  @StoreSelect() scene$: Observable<ISceneState>;
  @StoreSelect() selection$: Observable<ISelectionState>;

  protected treeElement: HTMLElement;

  selected: string[] = [];
  properties: PropertyOptionsExt[];
  private timer: any;

  constructor(public element: ElementRef, private store: Store, private cdr: ChangeDetectorRef, private zone: NgZone) {
    this.nestedTreeControl = new NestedTreeControl<NodeData>(() => []);
    this.nestedDataSource = new MatTreeNestedDataSource();
    this.nestedDataSource.data = [];
    this.cdr.detach();
  }

  ngAfterViewInit(): void {
    this.treeElement = <HTMLElement>(<HTMLElement>this.element.nativeElement).getElementsByTagName('mat-tree')[0];
    this.zone.runOutsideAngular(() => {
      this.scene$.subscribe(data => {
        this.nestedDataSource.data = <any>data.entities;
        this.cdr.detectChanges();
      });

      this.selection$.subscribe(data => {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          this.selected = data.entities;
          this.properties = data.properties;
          this.cdr.detectChanges();
        }, 1000 / 60);
      });
    });
  }

  hasNestedChild = (_: number, nodeData: NodeData) => nodeData.entities;

  isSelected(node: EntityData) {
    return this.selected.indexOf(node.id) >= 0;
  }

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

  toggleSelected(node) {
    const whereMulti = this.selected.length > 1;
    const wasSelected = this.isSelected(node);
    this.store.dispatch(new Unselect())
      .first()
      .subscribe(() => {
        if (!wasSelected || whereMulti)
          this.store.dispatch(new Select([node.id]));
      });
  }

  updateMaxHeight(val) {
    // if (!this.treeElement) return;
    this.treeElement.style.maxHeight = `${val - 40}px`;
  }

  resetMaxHeight() {
    if (!this.treeElement) return;
    this.treeElement.style.maxHeight = null;
  }
}
