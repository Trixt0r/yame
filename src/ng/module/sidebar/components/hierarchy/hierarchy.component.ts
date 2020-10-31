import {
  Component,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  NgZone,
  ChangeDetectionStrategy,
  Input,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { SceneEntity, StringSceneComponent, SceneEntityType, SceneComponent } from 'common/scene';
import {
  CreateEntity,
  UpdateEntity,
  DeleteEntity,
  SortEntity,
  CloneEntity,
} from 'ng/module/scene/states/actions/entity.action';
import { Unselect, Select, Isolate } from 'ng/module/scene/states/actions/select.action';
import { SceneService } from 'ng/module/scene';
import { ITreeNode, ITreeOptions } from 'angular-tree-component/dist/defs/api';
import {
  TreeComponent,
  TREE_ACTIONS,
  TreeModel,
  TreeNode as TreeNodeModel,
} from 'angular-tree-component';
import { Subscription } from 'rxjs';
import { cloneDeep } from 'lodash';

// Use an extended instance type, to be able to distinguish, who dispatched the action
class TreeSelect extends Select {}
class TreeUnselect extends Unselect {}

enum EntitySelectionMode {
  TOGGLE,
  MULTI,
  MULTI_SHIFT,
}

/**
 * Node with expandable and level information.
 */
interface TreeNode {
  id: string;
  name: string;
  source: SceneEntity;
  children?: TreeNode[];
  isExpanded?: boolean;
  virtual?: boolean;
}

/**
 * The hierarchy component is responsible for outlining the scene hierarchy.
 *
 * It allows the user to apply additional actions, like locking, deleting and toggling visibility of a node in the scene.
 */
@Component({
  moduleId: module.id.toString(),
  selector: 'yame-hierarchy',
  templateUrl: 'hierarchy.component.html',
  styleUrls: ['./hierarchy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HierarchyComponent implements AfterViewInit, OnDestroy {
  /**
   * The title of this component.
   */
  title: string = 'Hierarchy';

  scrollTop: number = 0;

  nodes: TreeNode[];

  previousShiftSelect: string[] = [];

  lastMouseEvent: MouseEvent;

  options: ITreeOptions = {
    nodeClass: (node: ITreeNode) => {
      const isolated = this.isolated;
      if (!isolated) return '';
      if (isolated === node.id) return 'isolated';
      const children = this.scene.getChildren(isolated, true);
      const found = children.find(it => it.id === node.id);
      return found ? 'isolated' : 'disabled';
    },
    allowDrop: (element: ITreeNode, to: any) => {
      const node = element.data as TreeNode;
      const target = to.parent.data as TreeNode;
      const isolated = this.isolated;
      if (isolated && isolated !== target.id) {
        const children = this.scene.getChildren(isolated, true);
        const found = children.find(it => it.id === target.id);
        if (!found) return false;
      }
      if (target.virtual) return true;
      if (target.id === element.id) return false;
      if (this.isLocked(target)) return false;
      switch (target.source.type) {
        case SceneEntityType.Object:
          return false;
        case SceneEntityType.Group:
        case SceneEntityType.Layer:
          return node.source.type !== SceneEntityType.Layer;
      }
    },
    allowDrag: (node: ITreeNode) => {
      const isolated = this.isolated;
      if (isolated) {
        const children = this.scene.getChildren(isolated, true);
        const found = children.find(it => it.id === node.id);
        if (!found) return false;
      }
      return this.scene.entities.length > 1 && !this.isLocked(node.data as TreeNode);
    },
    actionMapping: {
      mouse: {
        click: (tree: TreeModel, node: TreeNodeModel, $event: MouseEvent) => {
          const mode = $event.shiftKey
            ? EntitySelectionMode.MULTI_SHIFT
            : $event.ctrlKey
            ? EntitySelectionMode.MULTI
            : EntitySelectionMode.TOGGLE;
          this.selectTreeNode(node, mode, $event);
        },
        dblClick: (tree: TreeModel, node: TreeNodeModel, $event: MouseEvent) => {
          this.lastMouseEvent = $event;
          const entity = this.scene.getEntity(node.id);
          if (entity.type !== SceneEntityType.Layer && entity.type !== SceneEntityType.Group) return;
          const isolated = this.store.snapshot().select.isolated as SceneEntity;
          if (isolated) {
            const isolatedNode = tree.getNodeById(isolated.id);
            if (node.id !== isolated.id && node.isDescendantOf(isolatedNode)) {
              this.store.dispatch(new Isolate(this.scene.getEntity(node.id)));
            } else {
              this.store.dispatch(new Isolate(null));
            }
          } else {
            this.store.dispatch(new Isolate(this.scene.getEntity(node.id)));
          }
        },
      },
    },
  };

  /**
   * The ids of the current selection.
   */
  @Input() selected: string[] = [];

  @ViewChild('tree', { read: ElementRef }) protected treeElement: ElementRef;
  @ViewChild('tree', { read: TreeComponent }) protected treeComponent: TreeComponent;

  @ViewChild('header') protected headerElement: ElementRef;

  get isolated(): string {
    const isolated = this.store.selectSnapshot(state => state.select).isolated as SceneEntity;
    return isolated ? isolated.id : null;
  }

  protected subs: Subscription[] = [];

  private isolating = false;

  constructor(
    protected scene: SceneService,
    protected store: Store,
    protected actions: Actions,
    protected cdr: ChangeDetectorRef,
    protected zone: NgZone
  ) {}

  /**
   * Subscribes to the scene observable to update changes.
   *
   * @inheritdoc
   */
  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.subs.push(
        this.actions.pipe(ofActionSuccessful(CreateEntity, DeleteEntity, SortEntity)).subscribe(() => {
          const entities = this.scene.entities;
          const self = this;
          const mapFn: (entity: SceneEntity) => TreeNode = (entity: SceneEntity) => {
            return {
              id: entity.id,
              name: self.getDisplayName(entity),
              source: entity,
              children: this.scene.getChildren(entity, false).map(mapFn),
            };
          };

          const expandedIds = this.treeComponent.treeModel.expandedNodeIds;
          const expanded = this.treeComponent.treeModel.expandedNodes;
          const notExpanded = entities
            .filter(it => !expandedIds[it.id])
            .map(it => this.treeComponent.treeModel.getNodeById(it.id))
            .filter(it => !!it);

          this.nodes = entities.filter(it => !it.parent).map(mapFn);

          this.cdr.detectChanges();

          // Collapse those, which have no children left.
          expanded.forEach(it => {
            const found = this.scene.getEntity(it.id);
            if (!found || found.children.length > 0) return;
            this.treeComponent.treeModel.setExpandedNode(it, false);
          });

          // Expand those, which got a child added
          notExpanded.forEach(it => {
            const found = this.scene.getEntity(it.id);
            if (!found || it.data.children.length === found.children.length) return;
            this.treeComponent.treeModel.setExpandedNode(it, true);
          });
        })
      );

      this.subs.push(
        this.actions.pipe(ofActionSuccessful(Select, Unselect)).subscribe((action: Select | Unselect) => {
          if (action instanceof TreeSelect || action instanceof TreeUnselect) return;
          const state = this.treeComponent.treeModel.getState();
          const activeNodeIds = {};
          this.store.selectSnapshot((store) => store.select).entities.forEach((id) => (activeNodeIds[id] = true));
          this.treeComponent.treeModel.setState({ ...state, activeNodeIds });
        })
      );
      this.subs.push(
        this.actions.pipe(ofActionSuccessful(Isolate)).subscribe((action: Isolate) => {
          this.isolating = true;
          if (action.entity) {
            const node = this.treeComponent.treeModel.getNodeById(action.entity.id);
            TREE_ACTIONS.EXPAND(this.treeComponent.treeModel, node, this.lastMouseEvent);
            TREE_ACTIONS.DEACTIVATE(this.treeComponent.treeModel, node, this.lastMouseEvent);
          }
          this.cdr.detectChanges();
          this.isolating = false;
        })
      );
    });
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy() {
    this.subs.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Returns whether the given node can have children or not.
   *
   * @param node
   */
  canHaveChildren(node: TreeNode): boolean {
    return node.source.type === SceneEntityType.Group || node.source.type === SceneEntityType.Layer;
  }

  /**
   * Returns the icon for the given tree node.
   *
   * @param node The tree node.
   * @param expanded Whether the node is expanded or not.
   * @return The icon name.
   */
  getIcon(node: TreeNode, expanded: boolean): string {
    const type = node.source.type;
    switch (type) {
      case SceneEntityType.Object:
        return 'lens';
      case SceneEntityType.Group:
        return expanded ? 'folder_open' : 'folder';
      case SceneEntityType.Layer:
        return 'layers';
      default:
        return expanded ? 'expand_more' : 'chevron_right';
    }
  }

  /**
   * Returns whether the given node is in the current selection or not.
   *
   * @param node
   */
  isSelected(node: TreeNode): boolean {
    return this.selected.indexOf(node.id) >= 0;
  }

  /**
   * Toggles the locked property of the given node and dispatches the update action to the store.
   *
   * @param event The mouse event.
   * @param node The node to be deleted.
   */
  toggleLock(event: MouseEvent, node: TreeNode): void {
    event.preventDefault();
    event.stopImmediatePropagation();
    const isLocked = this.isLocked(node);
    this.store.dispatch(
      new UpdateEntity(
        {
          id: node.id,
          components: [{ id: 'locked', type: 'boolean', bool: !isLocked }],
        },
        isLocked ? 'unlock' : 'lock'
      )
    );
  }

  /**
   * Returns whether the given entity is locked or not.
   *
   * @param node The node to check the value for.
   */
  isLocked(node: TreeNode): boolean {
    return node.source.components.getValue('locked', 'bool', false);
  }

  /**
   * Toggles the NodeData property of the given node and dispatches the update action to the store.
   *
   * @param node
   */
  toggleVisibility(event: MouseEvent, node: TreeNode) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const isVisible = this.isVisible(node);

    this.store.dispatch(
      new UpdateEntity(
        {
          id: node.id,
          components: [{ id: 'visible', type: 'boolean', bool: !isVisible }],
        },
        isVisible ? 'hide' : 'show'
      )
    );
  }

  /**
   * Returns whether the given node is visible or not.
   *
   * @param node The node to return the value for.
   */
  isVisible(node: TreeNode): boolean {
    return node.source.components.getValue('visible', 'bool', true);
  }

  /**
   * Dispatches the delete action to the store, causing the node being removed from the store.
   *
   * @param event The mouse event.
   * @param node The node to be deleted.
   */
  removeEntity(event: MouseEvent, node: TreeNode): void {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.store.dispatch(new DeleteEntity(node.id));
  }

  /**
   * Returns whether the given node has a changed state.
   *
   * This causes the component to render the action icons on the tree node, when not hovered.
   *
   * @param node The node to return the value for.
   */
  isChanged(node: TreeNode): boolean {
    return this.isLocked(node) || !this.isVisible(node);
  }

  /**
   * Handles the selection of a tree node.
   *
   * @param event The triggered event.
   */
  onActivate(event: any): void {
    const data = event.node.data as TreeNode;
    const isolated = this.isolated;
    if (isolated && !this.scene.getChildren(isolated, true).find(it => data.id === it.id)) {
      this.isolating = true;
      TREE_ACTIONS.DEACTIVATE(this.treeComponent.treeModel, event.node, { });
      this.store.dispatch(new Isolate(null));
      this.isolating = false;
    } else {
      const entity = this.scene.getEntity(data.id);
      const components = cloneDeep(entity.components.elements) as SceneComponent[];
      this.store.dispatch(new TreeSelect([data.id], components, !this.isolating));
    }
  }

  /**
   * Handles the deselection of a tree node.
   *
   * @param event The triggered event.
   */
  onDeactivate(event: any) {
    const data = event.node.data as TreeNode;
    this.store.dispatch(new TreeUnselect([data.id], [], !this.isolating));
  }

  /**
   * Returns the display name of the given node.
   *
   * @param node The scene entity.
   * @return The display name.
   */
  getDisplayName(node: TreeNode | SceneEntity): string {
    const entity = node instanceof SceneEntity ? node : this.scene.getEntity(node.id);
    const nameComp = entity.components.byId('name') as StringSceneComponent;
    return nameComp ? nameComp.string || node.id : node.id;
  }

  /**
   * Updates the maximum height of this component based on the given value.
   *
   * @param val The new value.
   */
  updateMaxHeight(val: number): void {
    if (!this.treeElement) return;
    const headerHeight = (this.headerElement.nativeElement as HTMLElement).offsetHeight;
    this.treeElement.nativeElement.style.maxHeight = `${val - headerHeight - 5}px`;
  }

  /**
   * Resets the css property `max-height`.
   */
  resetMaxHeight(): void {
    if (!this.treeElement) return;
    this.treeElement.nativeElement.style.maxHeight = null;
  }

  /**
   * Handles the selected menu item event.
   *
   * @param id
   */
  onSelectedMenuItem(id: string): void {
    this.scene.addEntity(0, 0);
  }

  /**
   * Handles the `moveNode` event.
   *
   * @param event The event data.
   */
  onMoveNode(event: any): void {
    const node = event.node;
    const to = event.to;

    const childrenLengthBefore = to.parent.virtual ? -1 : to.parent.source.children.length;

    this.store
      .dispatch(
        new SortEntity({
          id: node.source.id,
          index: to.index,
          parent: to.parent.virtual ? null : to.parent.source.id,
          oldParent: node.source.parent,
        })
      )
      .subscribe(() => {
        if (!to.parent.virtual) {
          const parentNode = this.treeComponent.treeModel.getNodeById(to.parent.source.id);
          if (parentNode.data.source.children.length !== childrenLengthBefore) {
            this.treeComponent.treeModel.setExpandedNode(parentNode, true);
          }
        }
      });
  }

  /**
   * Handles the `copyNode` event.
   *
   * @param event The event data.
   */
  onCopyNode(event: any): void {
    const node = event.node;
    const to = event.to;
    this.store.dispatch(
      new CloneEntity({ id: node.source.id, index: to.index, parent: to.parent.virtual ? null : to.parent.source.id })
    );
  }

  canSelectTreeNode(node: TreeNodeModel): boolean {
    const isolated = this.store.snapshot().select.isolated as SceneEntity;
    if (isolated) {
      if (isolated.id === node.id) return false;
      const isolatedNode = this.treeComponent.treeModel.getNodeById(isolated.id);
      if (!node.isDescendantOf(isolatedNode)) return false;
    }
    return true;
  }

  /**
   * Selects the given tree node with the given selection mode.
   *
   * @param node The node to select or unselect.
   * @param mode The selection mode.
   * @param originalEvent The originally triggered event.
   */
  selectTreeNode(node: TreeNodeModel, mode: EntitySelectionMode, originalEvent: unknown): void {
    const isolated = this.store.snapshot().select.isolated as SceneEntity;
    if (isolated) {
      if (isolated.id === node.id) return;
      const isolatedNode = this.treeComponent.treeModel.getNodeById(isolated.id);
      if (!node.isDescendantOf(isolatedNode)) {
        this.store.dispatch(new Isolate(null));
        return;
      }
    }
    const shiftSelect = mode === EntitySelectionMode.MULTI_SHIFT;
    const multiSelect = shiftSelect || mode === EntitySelectionMode.MULTI;
    const tree = this.treeComponent.treeModel;
    const selectedIds = Object.keys(tree.getState().activeNodeIds);
    if (multiSelect) {
      const selectedNodes = tree.getActiveNodes();
      const parentIsSelected = selectedNodes.find((parent) => parent !== node && node.isDescendantOf(parent));
      if (parentIsSelected) return;
      let toUnselect = [];
      let toSelect = [];
      if (shiftSelect) {
        const focusedNode = tree.focusedNode as TreeNodeModel;
        toSelect.push(node.id);
        if (focusedNode.id !== node.id) toSelect.push(focusedNode.id);
        if (node.position < focusedNode.position) {
          let next = node.findNextNode(false, true) as TreeNodeModel;
          while (next && next !== focusedNode) {
            toSelect.push(next.id);
            next = next.findNextNode(false, true);
          }
        } else if (node.position > focusedNode.position) {
          let prev = node.findPreviousNode(true) as TreeNodeModel;
          while (prev && prev !== focusedNode) {
            toSelect.push(prev.id);
            prev = prev.findPreviousNode(true);
          }
        }
        // Filter out all nodes, which are selected via their parent
        toSelect = toSelect.slice().filter((id) => {
          const child = tree.getNodeById(id) as TreeNodeModel;
          const found = toSelect.find((it) => {
            if (it === id) return false;
            const parent = tree.getNodeById(it) as TreeNodeModel;
            return child.isDescendantOf(parent);
          });
          if (found && this.previousShiftSelect.indexOf(id) < 0) this.previousShiftSelect.push(id);
          return !found;
        });
        toUnselect = this.previousShiftSelect.filter((id) => toSelect.indexOf(id) < 0);
        this.previousShiftSelect = toSelect.slice();
      } else {
        this.previousShiftSelect = [];
        toUnselect = selectedIds.filter((id) => node.children.find((child) => child.id === id));
        if (selectedIds.indexOf(node.id) >= 0) toUnselect.push(node.id);
        else toSelect.push(node.id);
        tree.setFocusedNode(node);
      }
      this.store
        .dispatch(new Select(toSelect, []))
        .subscribe(() => {
          if (toUnselect.length > 0) this.store.dispatch(new Unselect(toUnselect));
        });
    } else {
      this.previousShiftSelect = [];
      if (selectedIds.indexOf(node.id) >= 0 && selectedIds.length > 1) {
        const toUnselect = selectedIds.filter((id) => id !== node.id);
        tree.setFocusedNode(node);
        this.store.dispatch(new Unselect(toUnselect));
      } else {
        TREE_ACTIONS.TOGGLE_ACTIVE(tree, node, originalEvent);
      }
    }
  }
}
