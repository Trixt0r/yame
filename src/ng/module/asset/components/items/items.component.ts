import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { Actions, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { Asset } from 'common/asset';
import { Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { LoadAssetResource, ScanResource, SelectAsset, UnselectAsset } from '../../states/actions/asset.action';
import { AssetState } from '../../states/asset.state';

const dragImage = new Image(0, 0);

@Component({
  selector: 'yame-asset-items',
  templateUrl: 'items.component.html',
  styleUrls: ['items.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetItemsComponent implements OnChanges, OnDestroy {

  /**
   * The group to render the assets for.
   */
  @Input() group?: Asset;

  /**
   * Selector for subscribing to asset updates.
   */
  @Select(AssetState.assets) assets$!: Observable<Asset[]>;

  /**
   * Selector for subscribing to icon updates.
   */
  @Select(AssetState.icons) icons$!: Observable<{ [icon: string]: string }>;

  @Select(AssetState.selectedAsset) asset$!: Observable<Asset>;

  @ViewChild(MatDrawer) drawer!: MatDrawer;

  /**
   * A list of all currently available assets.
   */
  allAssets: Asset[] = [];

  /**
   * The assets to display.
   */
  assets: Asset[] = [];

  /**
   * The current asset icon map.
   */
  icons: { [icon: string]: string } = { };

  /**
   * The currently selected asset.
   */
  selectedAsset: Asset | null = null;

  /**
   * Whether assets are being loaded or not.
   */
  loading = false;

  /**
   * Subject which gets triggered as soon as this component gets destroyed.
   */
  protected destroy$ = new Subject();

  constructor(protected store: Store, protected cdr: ChangeDetectorRef, protected zone: NgZone, actions: Actions) {
    zone.runOutsideAngular(() => {
      this.assets$.pipe(takeUntil(this.destroy$)).subscribe(assets => {
        this.allAssets = assets;
        this.updateAssets();
      });
      this.icons$.pipe(takeUntil(this.destroy$)).subscribe(icons => this.icons = icons);
      this.asset$.subscribe(asset => {
        this.selectedAsset = asset;
        if (!asset || asset.resource.loaded) return this.cdr.markForCheck();
        this.store.dispatch(new ScanResource(asset.resource.uri, asset.resource.source, asset.resource.type))
                    .subscribe(() => {
                      actions.pipe(ofActionSuccessful(LoadAssetResource), take(1))
                              .subscribe(() => this.cdr.markForCheck());
                    });
      });
    });
  }

  /**
   * Updates the internal list of assets, based on the currently set
   */
  protected updateAssets(): void {
    if (!this.group) this.assets = [];
    else this.assets = this.allAssets.filter((it) => it.type !== 'group' && it.parent && it.parent === this.group!.id);
    this.cdr.markForCheck();
  }

  /**
   * Returns the icon for the given asset.
   *
   * @param asset The asset.
   * @return The icon name.
   */
  getIcon(asset: Asset): string {
    return this.icons[asset.type] || 'insert_drive_file';
  }

  /**
   * Toggles the given asset.
   *
   * @param asset The asset to toggle.
   */
  toggleAsset(asset: Asset): void {
    this.store.dispatch(this.selectedAsset?.id === asset.id ? new UnselectAsset() : new SelectAsset(asset));
  }

  /**
   * Overrides the default drag image.
   *
   * @param event The triggered event.
   */
  onDragStart(event: DragEvent): void {
    event.dataTransfer?.setDragImage(dragImage, 0, 0);
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.group) return;
    if (this.group && !this.group.resource.loaded) {
      this.loading = true;
      this.store.dispatch(new ScanResource(this.group.resource.uri, this.group.resource.source))
                .subscribe(() => {
                  this.loading = false;
                  this.cdr.markForCheck();
                });
    } else this.updateAssets();
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
