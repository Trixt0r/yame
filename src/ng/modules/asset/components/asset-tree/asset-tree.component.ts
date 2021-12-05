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
import {
  IAssetsSource,
  LoadFromAssetsSource,
  RemoveAsset,
  ScanResource,
  SelectAsset,
  UnselectAsset,
} from '../../states/actions/asset.action';
import { AssetState } from '../../states/asset.state';
import { Observable, Subject } from 'rxjs';
import { filter, first, take, takeUntil } from 'rxjs/operators';
import { Asset } from 'common/asset';
import { IResource, IResourceGroup } from 'common/interfaces/resource';
import { NzFormatEmitEvent, NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { flatten, isEqual } from 'lodash';

type AssetTreeNode = NzTreeNodeOptions & { asset: Asset };

@Component({
  selector: 'yame-asset-tree',
  templateUrl: 'asset-tree.component.html',
  styleUrls: ['asset-tree.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AssetTreeComponent implements OnDestroy {
  /**
   * The group to be set externally.
   */
  @Input() asset: Asset | null = null;

  /**
   * Select event emitted as soon as a group got selected.
   */
  @Output() select = new EventEmitter<Asset>();

  /**
   * Unselect event emitted as soon as the current group got unselected.
   */
  @Output() unselect = new EventEmitter<Asset>();

  /**
   * Selector for subscribing to asset source updates.
   */
  @Select(AssetState.sources) assetSources$!: Observable<IAssetsSource[]>;

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
   * The currently available asset sources.
   */
  assetSources: IAssetsSource[] = [];

  /**
   * All currently available asset groups.
   */
  assets: Asset[] = [];

  /**
   * The (nested) tree nodes to display.
   */
  nodes: AssetTreeNode[] = [];

  /**
   * Queue of asset ids, which will force a change detection as soon an asset state change happened.
   */
  protected expansionQueue: string[] = [];

  /**
   * Subject which gets triggered as soon as this component gets destroyed.
   */
  protected destroy$ = new Subject<void>();

  constructor(protected store: Store, protected zone: NgZone, protected cdr: ChangeDetectorRef) {
    zone.runOutsideAngular(() => {
      const getFlatNodes = () => {
        const map: any = (node: AssetTreeNode) => [node, ...flatten((node.children ?? []).map(map) as AssetTreeNode[])];
        return flatten(this.nodes.map(map)) as AssetTreeNode[];
      };
      let waitingForResource = false;

      this.assetSources$.pipe(takeUntil(this.destroy$)).subscribe((sources) => (this.assetSources = sources));
      this.assets$.pipe(takeUntil(this.destroy$)).subscribe(async (assets) => {
        // Check first, if we need to update the nodes, if not, don't do anything
        const hasQueued = assets.some((_) => this.expansionQueue.indexOf(_.id) >= 0);
        if (waitingForResource || (!hasQueued && isEqual(assets, this.assets))) return;
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

        this.assets = AssetState.assets(store.snapshot().assets);

        // Update the tree nodes based on the current asset state. Restore expanded nodes state
        this.nodes = this.assets.filter((it) => !it.parent).map(this.mapToNzTreeNode.bind(this));
        getFlatNodes().forEach((node) => (node.expanded = expanded.indexOf(node.key) >= 0));
        // Remove loaded assets from the expansion queue
        const notLoadedIds = this.assets.filter((_) => !_.resource.loaded).map((g) => g.id);
        this.expansionQueue = this.expansionQueue.filter((_) => notLoadedIds.indexOf(_) >= 0);

        this.cdr.markForCheck();
      });
      this.icons$.pipe(takeUntil(this.destroy$)).subscribe((icons) => (this.icons = icons));
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
      children: this.assets.filter((it) => it.parent === asset.id).map(this.mapToNzTreeNode.bind(this)),
      asset,
    };

    node.isLeaf = !Array.isArray(asset.resource.data) || (asset.resource.loaded && node.children?.length == 0);
    return node;
  }

  /**
   * Handles the tree node click event, i.e. node selection.
   *
   * @param event The triggered event.
   */
  onNzClick(event: NzFormatEmitEvent): void {
    const node = event.node?.origin as any as AssetTreeNode;
    const isSelected = event.node?.isSelected;
    this.asset = isSelected ? node?.asset : null;
    if (isSelected) this.expansionQueue.push(node.asset.id);

    console.log(this.asset);

    this.store.dispatch(!this.asset ? new UnselectAsset() : new SelectAsset(this.asset!));

    const emitter = isSelected ? this.select : this.unselect;
    emitter.emit(node?.asset);
  }

  /**
   * Handles the node expansion event.
   * Makes sure, that the resource gets scanned, if not done yet.
   *
   * @param event The triggered event.
   */
  async onNzExpandChange(event: NzFormatEmitEvent): Promise<void> {
    const node = event.node;
    const group = this.assets.find((it) => it.id === node?.key);
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

  /**
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
