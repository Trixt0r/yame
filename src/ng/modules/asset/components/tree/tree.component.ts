import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  NgZone,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { RemoveAsset, ScanResource, AssetState } from '../../states';
import { firstValueFrom, Observable } from 'rxjs';
import { filter, first, take, takeUntil } from 'rxjs/operators';
import { Asset } from 'common/asset';
import { NzFormatEmitEvent, NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { flatten, isEqual } from 'lodash';
import { DestroyLifecycle } from 'ng/modules/utils';

type AssetTreeNode = NzTreeNodeOptions & { asset: Asset };

@Component({
    selector: 'yame-asset-tree',
    templateUrl: 'tree.component.html',
    styleUrls: ['tree.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [DestroyLifecycle],
    standalone: false
})
export class AssetTreeComponent {
  /**
   * The asset to be set externally.
   */
  @Input() asset: Asset | null = null;

  /**
   * The height of the tree.
   */
  @Input() height?: number;

  /**
   * Emitted as soon as the asset selection changed.
   */
  @Output() assetChange = new EventEmitter<Asset | null>();

  @HostBinding('style.height')
  @HostBinding('style.max-height')
  get maxHeight(): string | null {
    return typeof this.height === 'number' ? `${this.height}px` : null;
  }

  /**
   * Selector for subscribing to asset group updates.
   */
  @Select(AssetState.assets) assets$!: Observable<Asset[]>;

  /**
   * Selector for subscribing to asset icon updates.
   */
  @Select(AssetState.icons) icons$!: Observable<{ [icon: string]: string }>;

  /**
   * Stream for subscribing to the asset loading state.
   */
  @Select(AssetState.scanningResource) loading$!: Observable<string>;

  /**
   * Current asset icon map.
   */
  icons: { [icon: string]: string } = {};

  /**
   * All currently available asset groups.
   */
  assets: Asset[] = [];

  /**
   * The (nested) tree nodes to display.
   */
  nodes: AssetTreeNode[] = [];

  /**
   * The selected node keys.
   */
  get selectedKeys(): string[] {
    return this.asset ? [this.asset.id] : [];
  }

  /**
   * All tree nodes as a flattened list.
   */
  get flatNodes(): AssetTreeNode[] {
    const map: any = (node: AssetTreeNode) => [node, ...flatten((node.children ?? []).map(map) as AssetTreeNode[])];
    return flatten(this.nodes.map(map)) as AssetTreeNode[];
  }

  /**
   * Queue of asset ids, which will force a change detection as soon an asset state change happened.
   */
  protected expansionQueue: string[] = [];

  constructor(
    protected store: Store,
    protected zone: NgZone,
    protected cdr: ChangeDetectorRef,
    destroy$: DestroyLifecycle
  ) {
    zone.runOutsideAngular(() => {
      let waitingForResource = false;
      this.assets$.pipe(takeUntil(destroy$)).subscribe(async assets => {
        // Check first, if we need to update the nodes, if not, don't do anything
        const hasQueued = assets.some(_ => this.expansionQueue.indexOf(_.id) >= 0);
        if (waitingForResource || (!hasQueued && isEqual(assets, this.assets))) return;
        // Wait for the current resource until it is loaded
        waitingForResource = !!(await firstValueFrom(this.loading$.pipe(take(1))));
        if (waitingForResource) {
          await firstValueFrom(
            this.loading$.pipe(
              filter(val => val === null),
              first()
            )
          );
          waitingForResource = false;
        }

        this.assets = AssetState.assets(store.snapshot().assets);
        this.updateNodes();
        // Remove loaded assets from the expansion queue
        const notLoadedIds = this.assets.filter(_ => !_.resource.loaded).map(g => g.id);
        this.expansionQueue = this.expansionQueue.filter(_ => notLoadedIds.indexOf(_) >= 0);
        cdr.markForCheck();
      });
      this.icons$.pipe(takeUntil(destroy$)).subscribe(icons => (this.icons = icons));
    });
  }

  /**
   * Maps the given asset group to a tree node.
   *
   * @param asset The group to map.
   */
  protected mapToNzTreeNode(asset: Asset): AssetTreeNode {
    const node: AssetTreeNode = {
      title: asset.resource.label ?? asset.resource.name,
      key: asset.id,
      selected: asset.id === this.asset?.id,
      children: this.assets.filter(it => it.parent === asset.id).map(this.mapToNzTreeNode.bind(this)),
      asset,
    };

    node.isLeaf = !Array.isArray(asset.resource.data) || (asset.resource.loaded && node.children?.length == 0);
    return node;
  }

  /**
   * Updates the internal nodes based on the current asset state.
   * Makes sure expansion state of all nodes is preserved.
   */
  protected updateNodes(): void {
    // Preserve the currently expanded nodes
    const expanded = this.flatNodes.filter(_ => _.expanded && !_.isLeaf).map(_ => _.key);
    // Update the tree nodes based on the current asset state. Restore expanded nodes state
    this.nodes = this.assets.filter(it => !it.parent).map(this.mapToNzTreeNode.bind(this));
    this.flatNodes.forEach(node => (node.expanded = expanded.indexOf(node.key) >= 0));
  }

  /**
   * Handles the tree node click event, i.e. node selection.
   *
   * @param event The triggered event.
   */
  onNzClick(event: NzFormatEmitEvent): void {
    const node = event.node?.origin as any as AssetTreeNode;
    const isSelected = event.node?.isSelected;
    if (!node.isLeaf) {
      const expanded = !event.node?.isExpanded;
      event.node?.setExpanded(expanded);
      this.updateNodes(); // Force a node list update
      this.onNzExpandChange(event);
      return this.cdr.markForCheck();
    }
    this.asset = isSelected ? node?.asset : null;
    if (isSelected) this.expansionQueue.push(node.asset.id);
    this.assetChange.emit(this.asset);
  }

  /**
   * Handles the node expansion event.
   * Makes sure, that the resource gets scanned, if not done yet.
   *
   * @param event The triggered event.
   */
  async onNzExpandChange(event: NzFormatEmitEvent): Promise<void> {
    const node = event.node;
    const group = this.assets.find(it => it.id === node?.key);
    if (!node || !group) return;

    if (group.resource.loaded || !node.isExpanded) return;

    this.expansionQueue.push(group.id);
    this.store.dispatch(new ScanResource(group.resource.uri, group.resource.source));
  }

  /**
   * Returns the icon for the given asset.
   *
   * @param asset The asset.
   * @return The icon name.
   */
  getIcon(asset: Asset): string {
    const re = this.icons[asset.type];
    if (re) return re;
    return asset.type !== 'group' ? 'file' : 'folder';
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
}
