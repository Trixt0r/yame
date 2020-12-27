import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Asset } from 'common/asset';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ScanResource } from '../../states/actions/asset.action';
import { AssetState } from '../../states/asset.state';

const dragImage = new Image(0, 0);

@Component({
  selector: 'yame-asset-items',
  templateUrl: 'items.component.html',
  styleUrls: ['items.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetItemsComponent implements OnChanges, OnDestroy {
  @Input() group?: Asset;

  @Select(AssetState.assets) assets$!: Observable<Asset[]>;
  @Select(AssetState.icons) icons$!: Observable<{ [icon: string]: string }>;
  allAssets: Asset[] = [];
  assets: Asset[] = [];
  icons: { [icon: string]: string } = { };

  loading = false;

  /**
   * Subject which gets triggered as soon as this component gets destroyed.
   */
  protected destroy$ = new Subject();

  constructor(protected store: Store, protected cdr: ChangeDetectorRef, protected zone: NgZone) {
    zone.runOutsideAngular(() => {
      this.assets$.pipe(takeUntil(this.destroy$)).subscribe(assets => {
        this.allAssets = assets;
        this.updateAssets();
      });
      this.icons$.pipe(takeUntil(this.destroy$)).subscribe(icons => this.icons = icons);
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
