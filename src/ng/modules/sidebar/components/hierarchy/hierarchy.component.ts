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
  ViewEncapsulation,
} from '@angular/core';
import { Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { SceneEntity, StringSceneComponent, SceneEntityType } from 'common/scene';
import {
  CreateEntity,
  UpdateEntity,
  DeleteEntity,
  SortEntity,
  Unselect,
  Select,
  Isolate,
  SceneService,
} from 'ng/modules/scene';
import { of, Subject } from 'rxjs';
import { flatten } from 'lodash';
import { NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { NzFormatBeforeDropEvent, NzFormatEmitEvent, NzTreeNodeKey } from 'ng-zorro-antd/core/tree';
import { takeUntil } from 'rxjs/operators';

enum EntitySelectionMode {
  TOGGLE,
  MULTI,
  MULTI_SHIFT,
}

type TreeNode = NzTreeNodeOptions & { entity: SceneEntity };

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
  encapsulation: ViewEncapsulation.None,
})
export class HierarchyComponent implements AfterViewInit, OnDestroy {
  /**
   * The icon mapping for each entity type.
   */
  static readonly ICON_MAP = {
    [SceneEntityType.Object]: 'border',
    [SceneEntityType.Group]: 'group',
    [SceneEntityType.Layer]: 'fa:layer',
  };

  /**
   * The list of tree nodes to display.
   */
  nodes: TreeNode[] = [];

  /**
   * The currently selected keys.
   */
  selectedKeys: NzTreeNodeKey[] = [];

  /**
   * Makes sure locked nodes can not be dropped anywhere.
   * Makes sure layer nodes can not be dropped into group nodes.
   *
   * @param event The triggered nz event.
   */
  nzBeforeDrop = (event: NzFormatBeforeDropEvent) => {
    const node = event.dragNode.origin as TreeNode;
    if (this.isLocked(node)) return of(false);
    const target = event.node;
    if (!target) return of(true);
    if (target.key === node.key) return of(false);
    switch ((target.origin as TreeNode).entity.type) {
      case SceneEntityType.Group:
      case SceneEntityType.Layer:
        return of(node.entity.type !== SceneEntityType.Layer);
    }
    return of(true);
  };

  /**
   * The current isolated entity id.
   */
  get isolated(): string | null {
    const isolated = this.store.selectSnapshot((state) => state.select).isolated as SceneEntity;
    return isolated ? isolated.id : null;
  }

  /**
   * The previously selected tree node.
   */
  protected prevSelectedNode?: TreeNode;

  /**
   * The previously selected shift selected keys.
   */
  protected previousShiftSelect: string[] = [];

  /**
   * The tree element reference.
   */
  @ViewChild('tree', { read: ElementRef }) protected treeElement!: ElementRef;

  /**
   * The header element reference
   */
  @ViewChild('header') protected headerElement!: ElementRef;

  /**
   * Emitted as soon as this component gets destroyed.
   */
  protected destroy$ = new Subject();

  constructor(
    protected scene: SceneService,
    protected store: Store,
    protected actions: Actions,
    protected cdr: ChangeDetectorRef,
    protected zone: NgZone
  ) {}

  /**
   * Returns all nodes in a flat list.
   */
  protected getFlatNodes(): TreeNode[] {
    const map: any = (node: TreeNode) => [node, ...flatten((node.children ?? []).map(map) as TreeNode[])];
    return flatten(this.nodes.map(map));
  }

  /**
   * Subscribes to the scene observable to update changes.
   *
   * @inheritdoc
   */
  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.actions
        .pipe(takeUntil(this.destroy$), ofActionSuccessful(CreateEntity, DeleteEntity, SortEntity))
        .subscribe(() => {
          const entities = this.scene.entities;
          const self = this;
          const flatNodes = this.getFlatNodes();

          // Keep expanded and selected nodes
          const expanded = flatNodes.filter((_) => _.expanded && !_.isLeaf).map((_) => _.key);
          const selected = flatNodes.filter((_) => _.selected).map((_) => _.key);

          const mapFn: (entity: SceneEntity) => TreeNode = (entity: SceneEntity) => {
            const children = this.scene.getChildren(entity, false);
            return {
              key: entity.id,
              title: self.getDisplayName(entity),
              isLeaf: entity.type !== SceneEntityType.Group && entity.type !== SceneEntityType.Layer,
              children: children.map(mapFn),
              expanded: children.length > 0 && expanded.indexOf(entity.id) >= 0,
              selected: selected.indexOf(entity.id) >= 0,
              entity,
            };
          };

          this.nodes = entities.filter((it) => !it.parent).map(mapFn);
          this.cdr.markForCheck();
        });
      this.actions.pipe(takeUntil(this.destroy$), ofActionSuccessful(Select, Unselect)).subscribe(() => {
        this.selectedKeys = this.store.snapshot().select.entities.slice();
        this.cdr.markForCheck();
      });
      this.actions.pipe(takeUntil(this.destroy$), ofActionSuccessful(Isolate)).subscribe((action: Isolate) => {
        if (action.entity) {
          const node = this.nodes.find((_) => _.key === action.entity?.id);
          if (node) node.expanded = true;
        }
        this.cdr.markForCheck();
      });
    });
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handles the entity click, i.e. selects or unselects the clicked node.
   *
   * @param event The triggered event.
   */
  onNzClick(event: NzFormatEmitEvent): void {
    const mode = event.event?.shiftKey
      ? EntitySelectionMode.MULTI_SHIFT
      : event.event?.ctrlKey
      ? EntitySelectionMode.MULTI
      : EntitySelectionMode.TOGGLE;
    const node = event.node?.origin as TreeNode;
    if (!node) return;
    this.selectTreeNode(node, mode);
  }

  /**
   * Handles the double click, i.e. isolates the double clicked entity.
   *
   * @param event The triggered event.
   */
  onNzDblClick(event: NzFormatEmitEvent): void {
    const entity: SceneEntity = event.node?.origin.entity;
    if (!entity || (entity.type !== SceneEntityType.Layer && entity.type !== SceneEntityType.Group)) return;
    const isolated = this.store.snapshot().select.isolated as SceneEntity;
    let toIsolate: SceneEntity | null = entity;
    if (isolated && entity.id !== isolated.id && this.scene.getChildren(isolated).some((it) => it.id === entity.id)) {
      toIsolate = null;
    }
    this.store.dispatch(new Isolate(toIsolate));
  }

  /**
   * Handles the drop event.
   * Makes sure entities are sorted as in the tree view.
   *
   * @param event The triggered event.
   */
  onNzDrop(event: NzFormatEmitEvent): void {
    const node = event.dragNode;
    if (!node) return;
    const children = node.parentNode ? node.parentNode.children : node.service?.rootNodes;
    this.store.dispatch(
      new SortEntity({
        id: node.key,
        index: children?.findIndex((_) => _.key === node.key) || 0,
        parent: node.parentNode?.key || null,
        oldParent: (node.origin as TreeNode).entity.parent,
      })
    );
  }

  /**
   * Handles the drag start event, i.e. makes sure locked nodes can not be dragged.
   *
   * @param event The triggered event.
   */
  onNzDragStart(event: NzFormatEmitEvent): void {
    if (!this.isLocked(event.dragNode?.origin as TreeNode)) return;
    event.event?.preventDefault();
    event.event?.stopPropagation();
  }

  /**
   * Returns whether the given node can have children or not.
   *
   * @param node
   */
  canHaveChildren(node: TreeNode): boolean {
    return node.entity.type === SceneEntityType.Group || node.entity.type === SceneEntityType.Layer;
  }

  /**
   * Returns the icon for the given tree node.
   *
   * @param node The tree node.
   * @return The icon name.
   */
  getIcon(node: TreeNode): string {
    return HierarchyComponent.ICON_MAP[node.entity.type] ?? 'border';
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
          id: node.key,
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
    return node.entity.components.getValue('locked', 'bool', false) as boolean;
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
          id: node.key,
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
    return node.entity.components.getValue('visible', 'bool', true) as boolean;
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
    this.store.dispatch(new DeleteEntity(node.key));
  }

  /**
   * Returns the display name of the given node.
   *
   * @param node The scene entity.
   * @return The display name.
   */
  getDisplayName(node: TreeNode | SceneEntity): string {
    const entity = node instanceof SceneEntity ? node : this.scene.getEntity(node.id);
    const nameComp = entity?.components.byId('name') as StringSceneComponent;
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
   * Selects the given tree node with the given selection mode.
   *
   * @param node The node to select or unselect.
   * @param mode The selection mode.
   */
  async selectTreeNode(node: TreeNode, mode: EntitySelectionMode): Promise<void> {
    const isolated = this.store.snapshot().select.isolated as SceneEntity;
    if (isolated) {
      if (isolated.id === node.id) return;
      if (!this.scene.getChildren(isolated).some((_) => _.id === node.key)) {
        this.store.dispatch(new Isolate(null));
        return;
      }
    }
    const shiftSelect = mode === EntitySelectionMode.MULTI_SHIFT;
    const multiSelect = shiftSelect || mode === EntitySelectionMode.MULTI;
    const selectedIds = this.selectedKeys as string[];
    if (multiSelect) {
      const parentIsSelected = this.selectedKeys.find(
        (parent) => parent !== node.key && this.scene.getChildren(parent as string).some((_) => _.id === node.key)
      );
      if (parentIsSelected) return;
      let toUnselect: string[] = [];
      let toSelect: string[] = [];
      if (shiftSelect && this.prevSelectedNode) {
        toSelect.push(node.key);
        const prevKey = this.prevSelectedNode.key;
        if (prevKey !== node.key) toSelect.push(prevKey);

        const nodes = this.getFlatNodes();

        const prevPosition = nodes.findIndex((_) => _.key === prevKey);
        const position = nodes.findIndex((_) => _.key === node.key);
        this.scene.getEntity(node.key)?.components;
        if (position < prevPosition) {
          for (let i = position + 1; i < prevPosition; i++) toSelect.push(nodes[i].key);
        } else if (position > prevPosition) {
          for (let i = prevPosition + 1; i < position; i++) toSelect.push(nodes[i].key);
        }
        // Filter out all nodes, which are selected via their parent
        toSelect = toSelect.slice().filter((id) => {
          const found = toSelect.find((it) => {
            if (it === id) return false;
            return this.scene.getChildren(it).some((_) => _.id === id);
          });
          if (found && this.previousShiftSelect.indexOf(id) < 0) this.previousShiftSelect.push(id);
          return !found;
        });
        toUnselect = this.previousShiftSelect.filter((id) => toSelect.indexOf(id) < 0);
        this.previousShiftSelect = toSelect.slice();
      } else {
        this.prevSelectedNode = node;
        this.previousShiftSelect = [];
        toUnselect = selectedIds.filter((id) => this.scene.getChildren(node.key).find((child) => child.id === id));
        if (selectedIds.indexOf(node.key) >= 0) toUnselect.push(node.key);
        else toSelect.push(node.key);
      }
      await this.store.dispatch(new Select(toSelect, [])).toPromise();
      if (toUnselect.length > 0) this.store.dispatch(new Unselect(toUnselect));
    } else {
      this.previousShiftSelect = [];
      if (selectedIds.indexOf(node.key) >= 0 && selectedIds.length > 1) {
        const toUnselect = selectedIds.filter((id) => id !== node.key);
        await this.store.dispatch(new Unselect(toUnselect)).toPromise();
        this.prevSelectedNode = node;
        this.store.dispatch(new Select([node.key]));
      } else {
        if (selectedIds.indexOf(node.key) >= 0) this.store.dispatch(new Unselect());
        else {
          this.prevSelectedNode = node;
          await this.store.dispatch(new Unselect()).toPromise();
          this.store.dispatch(new Select([node.key], []));
        }
      }
    }
  }
}
