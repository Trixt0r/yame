import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { IAssetsSource, LoadFromAssetsSource, RemoveAsset, ScanResource } from '../../states/actions/asset.action';
import { AssetState } from '../../states/asset.state';
import { Observable, Subject } from 'rxjs';
import { filter, first, take, takeUntil } from 'rxjs/operators';
import { Asset } from 'common/asset';
import { IResourceGroup } from 'common/interfaces/resource';
import { NzFormatEmitEvent, NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { flatten, isEqual } from 'lodash';

type GroupTreeNode = NzTreeNodeOptions & { group: Asset<IResourceGroup> };

@Component({
  selector: 'yame-asset-groups',
  templateUrl: 'groups.component.html',
  styleUrls: ['groups.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AssetGroupsComponent implements OnDestroy {
  /**
   * The group to be set externally.
   */
  @Input() group: Asset<IResourceGroup> | null = null;

  /**
   * Select event emitted as soon as a group got selected.
   */
  @Output() select = new EventEmitter<Asset<IResourceGroup>>();

  /**
   * Unselect event emitted as soon as the current group got unselected.
   */
  @Output() unselect = new EventEmitter<Asset<IResourceGroup>>();

  /**
   * Selector for subscribing to asset source updates.
   */
  @Select(AssetState.sources) assetSources$!: Observable<IAssetsSource[]>;

  /**
   * Selector for subscribing to asset group updates.
   */
  @Select(AssetState.groups) groups$!: Observable<Asset<IResourceGroup>[]>;

  /**
   * Selector for subscribing to asset icon updates.
   */
  @Select(AssetState.icons) icons$!: Observable<{ [icon: string]: string }>;

  /**
   * Stream for subscribing to the group loading state.
   */
  @Select(AssetState.scanningResource) loading$!: Observable<string>;

  /**
   * Current asset icon map.
   */
  icons: { [icon: string]: string } = {};

  /**
   * The currently available asset sources.
   */
  assetSources: IAssetsSource[] = [];

  /**
   * All currently available asset groups.
   */
  groups: Asset<IResourceGroup>[] = [];

  /**
   * The (nested) tree nodes to display.
   */
  nodes: GroupTreeNode[] = [];

  /**
   * Queue of group ids, which will force a change detection as soon an asset state change happened.
   */
  protected expansionQueue: string[] = [];

  /**
   * Subject which gets triggered as soon as this component gets destroyed.
   */
  protected destroy$ = new Subject<void>();

  constructor(protected store: Store, protected zone: NgZone, protected cdr: ChangeDetectorRef) {
    zone.runOutsideAngular(() => {
      const getFlatNodes = () => {
        const map: any = (node: GroupTreeNode) => [node, ...flatten((node.children ?? []).map(map) as GroupTreeNode[])];
        return flatten(this.nodes.map(map)) as GroupTreeNode[];
      };
      let waitingForResource = false;

      this.assetSources$.pipe(takeUntil(this.destroy$)).subscribe((sources) => (this.assetSources = sources));
      this.groups$.pipe(takeUntil(this.destroy$)).subscribe(async (groups) => {
        // Check first, if we need to update the nodes, if not, don't do anything
        const hasQueued = groups.some((_) => this.expansionQueue.indexOf(_.id) >= 0);
        if (waitingForResource || (!hasQueued && isEqual(groups, this.groups))) return;
        // Preserve the currently expanded nodes
        const expanded = getFlatNodes()
          .filter((_) => _.expanded && !_.isLeaf)
          .map((_) => _.key);
        // Wait for the current resource until it is loaded
        waitingForResource = !!(await this.loading$.pipe(take(1)).toPromise());
        if (waitingForResource) {
          await this.loading$
            .pipe(
              filter((val) => val === null),
              first()
            )
            .toPromise();
          waitingForResource = false;
        }

        this.groups = AssetState.groups(store.snapshot().assets);

        // Update the tree nodes based on the current asset state. Restore expanded nodes state
        this.nodes = this.groups.filter((it) => !it.parent).map(this.mapToNzTreeNode.bind(this));
        getFlatNodes().forEach((node) => (node.expanded = expanded.indexOf(node.key) >= 0));
        // Remove loaded assets from the expansion queue
        const notLoadedIds = this.groups.filter((_) => !_.resource.loaded).map((g) => g.id);
        this.expansionQueue = this.expansionQueue.filter((_) => notLoadedIds.indexOf(_) >= 0);

        this.cdr.markForCheck();
      });
      this.icons$.pipe(takeUntil(this.destroy$)).subscribe((icons) => (this.icons = icons));
    });
  }

  /**
   * Maps the given asset group to a tree node.
   *
   * @param group The group to map.
   */
  protected mapToNzTreeNode(group: Asset<IResourceGroup>): GroupTreeNode {
    const node: GroupTreeNode = {
      title: group.resource.label ?? group.resource.name,
      key: group.id,
      selected: group.id === this.group?.id,
      children: this.groups.filter((it) => it.parent === group.id).map(this.mapToNzTreeNode.bind(this)),
      group,
    };

    node.isLeaf =
      group.type !== 'group' ||
      !Array.isArray(group.resource.data) ||
      (group.resource.loaded && node.children?.length == 0);
    return node;
  }

  /**
   * Handles the tree node click event, i.e. node selection.
   *
   * @param event The triggered event.
   */
  onNzClick(event: NzFormatEmitEvent): void {
    const node = event.node?.origin as any as GroupTreeNode;
    const isSelected = event.node?.isSelected;
    this.group = isSelected ? node?.group : null;
    if (isSelected) this.expansionQueue.push(node.group.id);
    const emitter = isSelected ? this.select : this.unselect;
    emitter.emit(node?.group);
  }

  /**
   * Handles the node expansion event.
   * Makes sure, that the resource gets scanned, if not done yet.
   *
   * @param event The triggered event.
   */
  async onNzExpandChange(event: NzFormatEmitEvent): Promise<void> {
    const node = event.node;
    const group = this.groups.find((it) => it.id === node?.key);
    if (!node || !group) return;

    if (group.resource.loaded || !node.isExpanded) return;

    this.expansionQueue.push(group.id);
    this.store.dispatch(new ScanResource(group.resource.uri, group.resource.source));
  }

  /**
   * Opens a dialog for opening a folder.
   *
   * @return `true` if a folder has been opened, `false` otherwise.
   */
  addFromSource(source: IAssetsSource): Observable<any> {
    return this.store.dispatch(new LoadFromAssetsSource(source));
  }

  /**
   * Returns the icon for the given asset.
   *
   * @param asset The asset.
   * @return The icon name.
   */
  getIcon(asset: Asset): string {
    return this.icons[asset.type] || 'folder';
  }

  /**
   * Removes the given asset node from the tree.
   *
   * @param event The triggered event.
   * @param group The group to remove.
   */
  removeSource(event: MouseEvent, group: Asset) {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.store.dispatch(new RemoveAsset(group.id));
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
