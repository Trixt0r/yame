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
import { TranslateService } from '@ngx-translate/core';
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

  /**
   * Selector for subscribing to type label updates.
   */
  @Select(AssetState.typeLabels) labels$!: Observable<{ [label: string]: string }>;

  /**
   * Selector for subscribing to asset selection.
   */
  @Select(AssetState.selectedAsset) asset$!: Observable<Asset>;

  @Select(AssetState.scanningResource) loading$!: Observable<string>;

  /**
   * Material drawer reference.
   */
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
  icons: { [icon: string]: string } = {};

  /**
   * The current asset type label map.
   */
  labels: { [label: string]: string } = {};

  /**
   * The currently selected asset.
   */
  selectedAsset: Asset | null = null;

  /**
   * Whether assets are being loaded or not.
   */
  loading = false;

  /**
   * The current language.
   */
  lang: string = 'en';

  /**
   * Subject which gets triggered as soon as this component gets destroyed.
   */
  protected destroy$ = new Subject();

  constructor(
    protected store: Store,
    protected translate: TranslateService,
    protected cdr: ChangeDetectorRef,
    protected zone: NgZone,
    actions: Actions
  ) {
    zone.runOutsideAngular(() => {
      this.assets$.pipe(takeUntil(this.destroy$)).subscribe((assets) => {
        this.allAssets = assets;
        this.updateAssets();
      });
      this.icons$.pipe(takeUntil(this.destroy$)).subscribe((icons) => (this.icons = icons));
      this.labels$.pipe(takeUntil(this.destroy$)).subscribe((labels) => (this.labels = labels));
      this.asset$.subscribe((asset) => {
        this.selectedAsset = asset;
        if (!asset || asset.resource.loaded) return this.cdr.markForCheck();
        this.store
          .dispatch(new ScanResource(asset.resource.uri, asset.resource.source, asset.resource.type))
          .subscribe(() => {
            actions.pipe(ofActionSuccessful(LoadAssetResource), take(1)).subscribe(() => this.cdr.markForCheck());
          });
      });

      this.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
        this.loading = this.group?.id === loading;
        this.updateAssets();
        cdr.markForCheck();
      });

      translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe((lang) => {
        this.lang = lang.lang;
        cdr.markForCheck();
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
   * Returns the type label for the given asset.
   *
   * @param asset The asset.
   * @return The label name.
   */
  getLabel(asset: Asset): string {
    return this.labels[asset.type] || asset.type;
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
    if (this.group && !this.group.resource.loaded)
      this.store.dispatch(new ScanResource(this.group.resource.uri, this.group.resource.source));
    else
      this.updateAssets();
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
