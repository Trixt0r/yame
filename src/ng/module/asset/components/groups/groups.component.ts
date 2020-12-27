import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, NgZone, OnDestroy, Output } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { IAssetsSource, LoadAssetResource, LoadFromAssetsSource, RemoveAsset, ScanResource } from '../../states/actions/asset.action';
import { AssetState } from '../../states/asset.state';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Asset } from 'common/asset';
import { ITreeOptions, TreeNode } from 'angular-tree-component';

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
export class AssetGroupsComponent implements OnDestroy {

  /**
   * Selector for subscribing to asset source updates.
   */
  @Select(AssetState.sources) assetSources$!: Observable<IAssetsSource[]>;

  @Select(AssetState.assets) assets$!: Observable<Asset[]>;
  @Select(AssetState.icons) icons$!: Observable<{ [icon: string]: string }>;
  icons: { [icon: string]: string } = { };

  @Output() select = new EventEmitter<Asset>();
  @Output() unselect = new EventEmitter<Asset>();

  /**
   * The currently available asset sources.
   */
  assetSources: IAssetsSource[] = [];

  assetGroups: AssetTreeNode[] = [];

  allAssets: Asset[] = [];

  options: ITreeOptions = {
    getChildren: (node: TreeNode) => {
      return new Promise(resolve => {
        this.store.dispatch(new ScanResource(node.data.asset.resource.uri, node.data.asset.resource.source))
                  .subscribe(() => {
                    resolve(
                      this.allAssets.filter(it => it.type === 'group' && it.parent === node.data.asset.id)
                                      .map(this.mapAssetToTreeNode.bind(this))
                    );
                  });
      })
    }
  };

  /**
   * Subject which gets triggered as soon as this component gets destroyed.
   */
  protected destroy$ = new Subject();

  constructor(protected store: Store, protected zone: NgZone, protected cdr: ChangeDetectorRef) {
    zone.runOutsideAngular(() => {
      this.assetSources$.pipe(takeUntil(this.destroy$)).subscribe(sources => this.assetSources = sources);
      this.assets$.pipe(takeUntil(this.destroy$)).subscribe(assets => {
        this.allAssets = assets;
        this.assetGroups = assets.filter(it => it.type === 'group' && !it.parent).map(this.mapAssetToTreeNode.bind(this));
        this.cdr.markForCheck();
      });
      this.icons$.pipe(takeUntil(this.destroy$)).subscribe(icons => this.icons = icons);
    });
  }

  protected mapAssetToTreeNode(asset: Asset): AssetTreeNode {
    const re: AssetTreeNode = {
      id: asset.id,
      name: asset.resource.label || asset.resource.name,
      asset,
      hasChildren: asset.type === 'group' || (Array.isArray(asset.resource.data) && asset.resource.data.length > 0),
      children: this.allAssets.filter(it => it.type === 'group' && it.parent === asset.id).map(this.mapAssetToTreeNode.bind(this)),
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
    this.select.emit(event.node.data.asset);
  }

  /**
   * Handles the deselection of an asset group.
   *
   * @param event The triggered event.
   */
  onDeactivate(event: any) {
    this.unselect.emit(event.node.data.asset);
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
