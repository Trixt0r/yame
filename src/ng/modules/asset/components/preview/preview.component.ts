import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Actions, ofActionSuccessful, Select } from '@ngxs/store';
import { Asset } from 'common/asset';
import { DestroyLifecycle, notify } from 'ng/modules/utils';
import { merge, Observable, takeUntil, tap } from 'rxjs';
import { AssetState, LoadAssetResource } from '../../states';

const dragImage = new Image(0, 0);

@Component({
  selector: 'yame-asset-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [DestroyLifecycle],
})
export class AssetPreviewComponent {
  /**
   * Selector for subscribing to asset selection.
   */
  @Select(AssetState.selectedAsset) asset$!: Observable<Asset>;

  /**
   * Selector for subscribing to icon updates.
   */
  @Select(AssetState.icons) icons$!: Observable<{ [icon: string]: string }>;

  /**
   * Selector for subscribing to type label updates.
   */
  @Select(AssetState.typeLabels) labels$!: Observable<{ [label: string]: string }>;

  /**
   * The currently selected asset.
   */
  selectedAsset: Asset | null = null;

  /**
   * The current asset icon map.
   */
  icons: { [icon: string]: string } = {};

  /**
   * The current asset type label map.
   */
  labels: { [label: string]: string } = {};

  /**
   * The current language.
   */
  lang: string;

  constructor(
    translate: TranslateService,
    actions: Actions,
    zone: NgZone,
    destroy$: DestroyLifecycle,
    cdr: ChangeDetectorRef
  ) {
    this.lang = translate.currentLang;
    zone.runOutsideAngular(() => {
      merge(
        this.asset$.pipe(tap(_ => (this.selectedAsset = _))),
        this.icons$.pipe(tap(_ => (this.icons = _))),
        this.labels$.pipe(tap(_ => (this.labels = _))),
        translate.onLangChange.pipe(tap(_ => (this.lang = _.lang))),
        actions.pipe(ofActionSuccessful(LoadAssetResource))
      )
        .pipe(takeUntil(destroy$), notify(cdr))
        .subscribe();
    });
  }

  /**
   * Returns the icon for the given asset.
   *
   * @param asset The asset.
   * @return The icon name.
   */
  getIcon(asset: Asset): string {
    return this.icons[asset.type] || 'file';
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
   * Overrides the default drag image.
   *
   * @param event The triggered event.
   */
  onDragStart(event: DragEvent): void {
    event.dataTransfer?.setDragImage(dragImage, 0, 0);
  }
}
