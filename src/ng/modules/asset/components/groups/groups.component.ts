import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import {
  IAssetsSource,
  LoadAssetResource,
  LoadFromAssetsSource,
  RemoveAsset,
  ScanResource,
} from '../../states/actions/asset.action';
import { AssetState } from '../../states/asset.state';
import { Observable, Subject } from 'rxjs';
import { filter, mergeMap, reduce, take, takeUntil } from 'rxjs/operators';
import { Asset } from 'common/asset';
import { ITreeOptions, TreeComponent, TreeNode } from 'angular-tree-component';
import { IResourceGroup } from 'common/interfaces/resource';

/**
 * Node with expandable and level information.
 */
interface AssetTreeNode {
  id: string;
  name: string;
  asset: Asset;
  children?: AssetTreeNode[];
  isExpanded?: boolean;
  hasChildren: boolean;
  virtual?: boolean;
}

@Component({
  selector: 'yame-asset-groups',
  templateUrl: 'groups.component.html',
  styleUrls: ['groups.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetGroupsComponent implements OnDestroy, OnChanges {
  /**
   * The group to be set externally.
   */
  @Input() group: Asset<IResourceGroup> | null = null;

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
  @Select(AssetState.groups) groups$!: Observable<Asset[]>;

  /**
   * Selector for subscribing to asset icon updates.
   */
  @Select(AssetState.icons) icons$!: Observable<{ [icon: string]: string }>;

  /**
   * Stream for subscribing to the group loading state.
   */
  @Select(AssetState.scanningResource) loading$!: Observable<string>;

  /**
   * The tree component reference.
   */
  @ViewChild(TreeComponent) tree!: TreeComponent;

  /**
   * Current asset icon map.
   */
  icons: { [icon: string]: string } = {};

  /**
   * The currently available asset sources.
   */
  assetSources: IAssetsSource[] = [];

  /**
   * Nodes to be rendered at the root of the tree.
   */
  groupNodes: AssetTreeNode[] = [];

  /**
   * All currently available asset groups.
   */
  groups: Asset[] = [];

  /**
   * Tree options to be passed to the tree component.
   */
  options: ITreeOptions = {
    getChildren: async (node: TreeNode) => {
      const uri = node.data.asset.resource.uri;
      if (node.data.asset.resource.loaded)
        return this.groups.filter((it) => it.parent === uri).map(this.mapAssetToTreeNode.bind(this));
      const current = await this.loading$.pipe(take(1)).toPromise();
      if (current === uri) {
        await this.loading$.pipe(filter(val => val === null)).toPromise();
        return this.groups.filter((it) => it.parent === uri).map(this.mapAssetToTreeNode.bind(this));
      }
      this.store.dispatch(new ScanResource(node.data.asset.resource.uri, node.data.asset.resource.source));
      await this.loading$.pipe(take(2), reduce(() => null, null)).toPromise();
      return this.groups.filter((it) => it.parent === uri).map(this.mapAssetToTreeNode.bind(this));
    },
  };

  /**
   * Subject which gets triggered as soon as this component gets destroyed.
   */
  protected destroy$ = new Subject();

  constructor(protected store: Store, protected zone: NgZone, protected cdr: ChangeDetectorRef) {
    zone.runOutsideAngular(() => {
      this.assetSources$.pipe(takeUntil(this.destroy$)).subscribe((sources) => (this.assetSources = sources));
      this.groups$.pipe(takeUntil(this.destroy$)).subscribe((assets) => {
        this.groups = assets;
        this.groupNodes = assets.filter((it) => !it.parent).map(this.mapAssetToTreeNode.bind(this));
        this.cdr.markForCheck();
      });
      this.icons$.pipe(takeUntil(this.destroy$)).subscribe((icons) => (this.icons = icons));
    });
  }

  /**
   * Maps the given asset to a tree node.
   *
   * @param asset The asset to map.
   */
  protected mapAssetToTreeNode(asset: Asset): AssetTreeNode {
    const re: AssetTreeNode = {
      id: asset.id,
      name: asset.resource.label || asset.resource.name,
      asset,
      hasChildren: asset.type === 'group' || (Array.isArray(asset.resource.data) && asset.resource.data.length > 0),
      children: this.groups.filter((it) => it.parent === asset.id).map(this.mapAssetToTreeNode.bind(this)),
    };
    if (re.children?.length === 0) delete re.children;
    return re;
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
   * @param node The node to remove.
   */
  removeSource(event: MouseEvent, node: AssetTreeNode) {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.store.dispatch(new RemoveAsset(node.id));
  }

  /**
   * Handles the selection of an asset group.
   *
   * @param event The triggered event.
   */
  onActivate(event: any): void {
    this.group = event.node.data.asset;
    this.select.emit(event.node.data.asset);
  }

  /**
   * Handles the deselection of an asset group.
   *
   * @param event The triggered event.
   */
  onDeactivate(event: any): void {
    this.group = null;
    this.unselect.emit(event.node.data.asset);
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.group || !this.tree) return;
    const state = this.tree.treeModel.getState();
    const activeNodeIds: { [key: string]: boolean } = {};
    const expandedNodeIds: { [key: string]: boolean } = {};
    this.groups.forEach((group) => {
      activeNodeIds[group.id] = group.id === this.group?.id;
      expandedNodeIds[group.id] = group.id === this.group?.id;
    });
    this.tree.treeModel.setState({ ...state, activeNodeIds, expandedNodeIds });
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
