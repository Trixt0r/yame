import { Component, ElementRef, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material';
import { Store, Select as StoreSelect } from '@ngxs/store';
import { ISceneState } from 'ng/module/pixi/ngxs/state';
import { Observable } from 'rxjs/Observable';
import { DeleteEntity, UpdateEntity } from 'ng/module/pixi/ngxs/actions';
import { Unselect, Select } from 'ng/module/toolbar/tools/selection/ngxs/actions';


interface NodeData {
  id: string;
  name: string;
  visibility: boolean;
  locked: boolean;
  entities?: NodeData[];
}

/**
 * The hierarchy component is responsible for outlining the scene hierarchy.
 *
 * It allows the user to apply additional actions, like locking, deleting and toggling visibility of a node in the scene.
 *
 * @export
 * @class HierarchyComponent
 * @implements {AfterViewInit}
 */
@Component({
  moduleId: module.id.toString(),
  selector: 'yame-hierarchy',
  templateUrl: 'hierarchy.html',
  styleUrls: ['./hierarchy.scss'],
})
export class HierarchyComponent implements AfterViewInit {

  /**
   * @type {Observable<ISceneState>} The scene state observable to which react to.
   */
  @StoreSelect(state => state.scene) scene$: Observable<ISceneState>;

  /**
   * @type {NestedTreeControl<NodeData>} The nested tree control, for the child tree view.
   */
  nestedTreeControl: NestedTreeControl<NodeData>;

  /**
   * @type {MatTreeNestedDataSource<NodeData>} The actual tree data.
   */
  nestedDataSource: MatTreeNestedDataSource<NodeData>;

  /**
   * @type {string} The title of this component.
   */
  title: string;

  /**
   * @type {string[]} The ids of the current selection.
   */
  selected: string[] = [];

  protected treeElement: HTMLElement;

  constructor(public element: ElementRef,
              protected store: Store,
              protected cdr: ChangeDetectorRef,
              protected zone: NgZone) {
    this.title = 'Hierarchy';
    this.nestedTreeControl = new NestedTreeControl<NodeData>(() => []);
    this.nestedDataSource = new MatTreeNestedDataSource();
    this.nestedDataSource.data = [];
  }

  /**
   * Subscribes to the scene observable to update changes.
   *
   * @override
   */
  ngAfterViewInit(): void {
    this.treeElement = <HTMLElement>(<HTMLElement>this.element.nativeElement).getElementsByTagName('mat-tree')[0];
    this.zone.runOutsideAngular(() => {
      this.scene$.subscribe(data => {
        this.nestedDataSource.data = <any>data.entities;
        this.cdr.detectChanges();
      });
    });
  }

  /**
   * Returns whether the given node has nested children or not.
   *
   * @param {number} _
   * @param {NodeData} nodeData
   * @returns {boolean}
   */
  hasNestedChild(_: number, nodeData: NodeData): boolean {
    return Array.isArray(nodeData.entities);
  }

  /**
   * Returns whether the given node is in the current selection or not.
   *
   * @param {NodeData} node
   * @returns {boolean}
   */
  isSelected(node: NodeData): boolean {
    return this.selected.indexOf(node.id) >= 0;
  }

  /**
   * Toggles the locked property of the given node and dispatches the update action to the store.
   *
   * @param {NodeData} node
   */
  toggleLock(node: NodeData): void {
    const message = node.locked ? 'unlock' : 'lock';
    const data = Object.assign({}, { id: node.id, locked: !node.locked });
    this.store.dispatch(new UpdateEntity(data, message));
  }

  /**
   * Toggles the NodeData property of the given node and dispatches the update action to the store.
   *
   * @param {NodeData} node
   */
  toggleVisibility(node: NodeData) {
    const message = node.visibility ? 'hide' : 'show';
    const data = Object.assign({}, { id: node.id, visibility: !node.visibility });
    this.store.dispatch(new UpdateEntity(data, message));
  }

  /**
   * Dispatches the delete action to the store, causing the node being removed from the store.
   *
   * @param {NodeData} node
   */
  removeEntity(node) {
    this.store.dispatch(new DeleteEntity(node.id));
  }

  /**
   * Returns whether the given node has a changed state.
   *
   * This causes the component to render the action icons on the tree node, when not hovered.
   *
   * @param {Entity} node
   * @returns {boolean}
   */
  isChanged(node: NodeData): boolean {
    return node.locked || !node.visibility;
  }

  /**
   * Toggles the selection state of the given node.
   *
   * If the node is selected, it will be removed from the selection and added otherwise.
   *
   * @param {NodeData} node
   */
  toggleSelected(node: NodeData): void {
    const isSelected = this.isSelected(node);
    const otherSelected = !isSelected && this.selected.length > 0;
    if (isSelected || otherSelected) {
      this.store.dispatch(new Unselect())
        .first()
        .subscribe(() => this.store.dispatch(new Select([node.id])));
    } else {
      this.store.dispatch(new Select([node.id]));
    }
  }

  /**
   * Updates the maximum height of this component based on the given value,
   *
   * @param {number} val
   */
  updateMaxHeight(val: number): void {
    this.treeElement.style.maxHeight = `${val - 40}px`;
  }

  /**
   * Resets the css property `max-height`.
   */
  resetMaxHeight(): void {
    if (!this.treeElement) return;
    this.treeElement.style.maxHeight = null;
  }
}
